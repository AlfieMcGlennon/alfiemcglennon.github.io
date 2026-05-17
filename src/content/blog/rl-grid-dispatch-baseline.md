---
title: "Training RL Agents to Dispatch the GB Power Grid"
description: "Four MLP agents, a CNN with 72 weather channels, and five reward functions. They all learned demand matching. None learned network constraints. The action space was the bottleneck."
date: 2026-03-15
project: "rl-dispatch"
accent: "#7c3aed"
tags: ["reinforcement-learning", "power-systems", "ppo", "gymnasium"]
draft: false
---

This is the RL write-up that led to the development of the grid tool. The early RL experiments made the case for building a proper validated GB grid environment, which is what the GB Grid Scenario Tool became. With a DC power flow model built from public NESO data sitting underneath, the question became: can an RL agent learn dispatch from experience?

If an agent could learn a reasonable dispatch policy from experience alone, that would be useful in situations where cost data is uncertain or the network is changing faster than the models can keep up.

This post covers two rounds of experiments. The first trained four PPO agents with different reward functions on scalar observations. The second added a CNN for spatial weather patterns and multi-hour forecasts. Both used the same three actions. That turned out to be the ceiling.

## The environment

The agent controls three continuous values each hour:

- **gas_frac** (0 to 1): fraction of residual demand filled with gas
- **import_frac** (0 to 1): fraction filled with imports
- **storage_frac** (-1 to 1): battery charge or discharge

Residual demand is what's left after wind, solar, nuclear, biomass, and hydro have generated. The agent's job is to fill the gap without overspending, oversupplying, or violating ramp constraints.

Gas ramp rate is capped at 5 GW/hr. This matters. At 10 GW/hr (my initial setting) the constraint was never binding and all four agents converged to identical strategies. At 5 GW/hr, the agent has to plan ahead, and different reward functions produce genuinely different behaviour.

Training data is 9 years of hourly generation, demand, and weather from NESO and ERA5 (2015-2024). Each agent trained for 5M timesteps on the University of Reading's RACC HPC cluster.

## Round 1: MLP agents

Four agents share the same architecture (two 256-unit hidden layers, PPO) and differ only in reward function:

**Cost-only** optimises total dispatch cost, with heavy penalties for unmet demand and mild penalties for curtailment.

**Reliable** adds a reserve margin penalty that triggers below 20% headroom.

**Weather-aware** scales the margin penalty by a weather stress multiplier (up to 4x during high-wind, low-demand periods).

**Green** halves the cost weight and adds an emissions penalty, pushing the agent toward imports over gas.

### Results

All values are percentages of residual demand unless noted.

| Agent | Cost vs NESO | Gas | Imports | Emissions |
|---|---|---|---|---|
| Cost | +6.2% | 99.7% | 0.3% | 47.9 Mt |
| Reliable | +6.4% | 100% | 0% | 48.0 Mt |
| Weather | +13.1% | 97.8% | 8.1% | 48.1 Mt |
| Green | +34.1% | 77.6% | 47.4% | 39.8 Mt |

The cost and reliable agents both converged on gas-dominated dispatch. Gas is cheap, reliable, and fast to ramp. The agent independently recovered something close to merit-order behaviour, matching NESO's actual dispatch cost within 6%. The gap between cost-only and reliable is tiny (+6.2% vs +6.4%). The reserve margin penalty occasionally holds back gas that would have been slightly cheaper to dispatch, but not by much.

The green agent is the outlier. Halving the cost weight and penalising emissions pushed imports to 47% of residual demand. Emissions dropped 17% but cost rose 34%. That's a real policy trade-off, not a training artefact.

The 5 GW ramp constraint created the divergence between agents. The weather-aware agent learned to pre-position gas output before forecast wind drops, while the cost agent just reacted each hour. Without the ramp constraint, these strategies are equivalent.

## Round 2: adding spatial intelligence

The MLP agents can't learn where power flows because they only see national aggregates. So I gave the agent spatial weather data and a CNN to process it.

### Architecture

A custom feature extractor (SpatialScalarExtractor, 448k parameters) processes two input streams:

**Spatial branch (CNN):** ERA5 weather fields at 0.25° resolution (37x41 grid) stacked across forecast lead times. At full configuration: 12 base channels (wind speed, solar radiation, temperature, pressure, cloud cover, soil moisture, geopotential, dewpoint, plus rasterised wind/solar farm capacity, terrain, and population density) x 6 forecast windows (T+0 through T+168h) = 72 input channels. Three conv layers (32, 64, 64 filters) reduce this to a 128-dim vector.

**Scalar branch (MLP):** 32 active features (generation by fuel type, demand, prices, battery state, time encoding) through two 64-unit layers to a 64-dim vector.

The 192-dim combined vector feeds into standard PPO policy and value heads.

The action space stayed the same. Still three continuous national values.

### Cost-only results

Values shown as percentage of residual demand. Gas values above 100% reflect rounding in hourly aggregation.

| Channels | Forecasts | Cost vs NESO | Gas | Imports |
|---|---|---|---|---|
| 12 | T+0 | +6.3% | 100.2% | 0.0% |
| 24 | T+0, T+3 | +6.3% | 100.2% | 0.0% |
| 48 | T+0 to T+24 | +6.1% | 100.2% | 0.0% |
| 72 | T+0 to T+168 | +6.1% | 100.2% | 0.0% |

Every configuration produced identical dispatch. Transfer learning made no difference. The CNN learned meaningful spatial representations (gradient analysis confirmed the filters activated differently for Scottish vs English wind patterns) but the agent couldn't act on them. With only three national levers, the optimal strategy is the same regardless of what the CNN sees.

### Reward engineering

If the architecture can't fix this, maybe the reward can. I tried three composite reward functions that explicitly incentivise diversification away from gas. All three failed, but in ways that taught me something.

Adding an unconditional import bonus and a gas dominance penalty just taught the agent to stack gas AND imports simultaneously, collecting the bonus while dumping excess as curtailment (50 TWh). Adding an anticipatory signal for forecast wind changes made the agent more conservative, not less. It over-dispatched as insurance against forecast uncertainty (61 TWh curtailed). Harsher curtailment penalties pushed the agent away from oversupply but overcorrected into shedding load (880k MWh unmet).

The agent found the loophole every time. It optimised the reward, not the grid.

The design that worked best was the **spatial balanced** variant:

- Cost weight 0.5 (not 0.3, keeps cost honest)
- Smooth symmetric balance penalty (quadratic around dispatch_ratio = 1.0)
- Anticipatory signal using forecast delta at farm locations (the one signal that genuinely requires both spatial weather and farm capacity channels)
- Linear gas shaping from 65% (no cliff edge)
- Gentle import preference, not unconditional

Result: Gas 85.3%, Imports 26.1%, Cost +12.8% vs NESO, 40.5 Mt emissions, 13.7 TWh curtailed, 347k MWh unmet.

Best compromise of any variant. Meaningful import usage without the oversupply exploit. Emissions 16% below cost-only. Trained for 12M steps on 72 channels, about 12 hours on a single GPU.

But still. Three national actions cannot precisely balance a spatially distributed system.

## Training infrastructure lessons

Three bugs cost me multiple wasted GPU runs.

**Dead critic.** The first composite reward run produced zero explained variance for 7M steps. Six reward terms on vastly different scales overwhelmed the value function. The fix was `VecNormalize(norm_reward=True)`. Explained variance jumped to 0.89. Multi-term rewards need reward normalisation.

**Broken transfer learning.** Transferring weights from cost-only to composite locked the policy completely. KL divergence above 2.0, 85% of gradient updates clipped. The cause: `VecNormalize` running statistics weren't saved alongside the model weights. The normalised reward distribution shifted, but the value function expected the old scale. Always save `vecnormalize.pkl` with the model.

**Entropy runaway.** With 72 input channels and the default entropy coefficient (0.0115), policy standard deviation climbed from 1 to 12 during training. The agent explored more over time instead of converging. Reducing the entropy coefficient to 0.008-0.01 fixed it. Larger observation spaces need tighter entropy control.

One other lesson: a 100-feature observation vector with 78 zeros drowns gradient signal. Cutting to 32 active features made a noticeable difference.

## What this proved

RL can learn dispatch fundamentals from experience. The agents learned to match demand, minimise cost, and follow wind, all from reward signal, without being told how dispatch works. Different reward functions produce meaningfully different policies, and the divergence is real, not noise.

The action space is the ceiling though. Spatial observations, a CNN, 72 weather channels, 7-day forecasts, and extensive reward engineering could not overcome three national dispatch levers. The agent can see that Scottish wind is high. It cannot reduce Scottish gas while increasing English gas. It can only adjust the national mix.

You cannot learn network-constrained dispatch without network topology in the action space.

This motivated building a proper GB grid environment with validated network topology, per-zone generation, and DC power flow, which became the GB Grid Scenario Tool. The next step combines the spatial CNN features with a full 109-action topology-aware action space (27 zones x 4 dispatchable types + interconnector), testing whether the spatial observations that were wasted here become the agent's primary advantage. That work is ongoing.
