# RL Environment Notes — GB Grid Dispatch

Private working notes for developing an RL agent that learns grid dispatch.
Not for publication — reference document for implementation planning.

---

## 0. The 4-Post Arc

This project is not a standalone tool. It is part of a multi-stage RL research programme on GB grid dispatch. The tool exists because post 2 failed and the environment needed to be built properly.

### Post 1: Baseline MLP-PPO (completed)
- Boilerplate MLP variant, PPO algorithm
- 3 discrete actions (increase/decrease/hold national dispatch level), flat state space
- 4 separate agents with different reward focuses:
  - Cost-minimisation agent
  - Constraint-satisfaction agent
  - Balanced (cost + constraints) agent
  - Renewable-priority agent
- Trained on simplified GB grid representation (no topology, no zonal resolution)
- **Result**: Convergence on basic dispatch patterns. All 4 agents learned to balance supply and demand. Cost agent rediscovered merit-order-like behaviour. Constraint agent was overly conservative. Demonstrated RL can learn dispatch — but without topology, it can't learn the interesting part (where power flows).

### Post 2: CNN + Forecasts (completed — failure post)
- Added CNN layers for spatial weather pattern recognition
- Extended state with multi-hour wind/solar forecasts and station availability
- Still 3 actions — same convergence ceiling as post 1
- **Failed to connect the spatial features to dispatch decisions** — the CNN saw weather patterns but had no mechanism to translate spatial information into spatially differentiated actions
- **Key lesson**: You cannot learn network-constrained dispatch without network topology in the action space. Adding observation complexity without action complexity doesn't help.
- Honest failure. Published as "what didn't work and why."

### Post 3: The Grid Tool (this project)
- Post 2's failure made clear: need proper topology, zonal resolution, physical network model
- No public open-source GB grid environment existed at the resolution needed
- Built the full 27-zone and 82-zone models from NESO open data
- Validated against published boundary transfers (B6F within 2%)
- Three dispatch baselines (simple, merit order, LOPF) provide comparison targets
- **The environment IS the contribution** — it enables post 4

### Post 4: Full Hybrid Agent (planned)
- Multi-reward architecture with combined hybrid reward function
- Full topology action space: per-zone dispatch fractions across all 27 (or 82) zones
- Physical constraints embedded:
  - Hard limits on some zones (nuclear MSL, must-run renewables)
  - Soft limits on others (thermal plant flexibility)
  - Boundary flow awareness through reward signal
- Multiple reward components weighted and combined:
  - Cost minimisation (should recover merit order behaviour)
  - Boundary violation penalty (should recover LOPF-like constraint awareness)
  - Demand balance (hard constraint via reward shaping)
  - Renewable curtailment penalty (should learn to export Scottish wind rather than curtail)
- **Success metric**: Agent approaches LOPF cost performance without explicit LP solver, while respecting network constraints learned from experience

### Why this ordering matters
The arc tells a story about inductive biases in RL:
1. You can learn dispatch with a flat MLP — but it's just merit order with extra steps
2. Adding CNN + forecasts without topology doesn't help — wrong inductive bias
3. The environment itself is the hard part — building validated GB grid topology from public data
4. With proper topology in the action space, RL can learn what LP solves analytically

---

## 1. How the RL Mapping Developed

### The journey
1. Started with "can RL learn to dispatch the GB grid?" — needed an environment first
2. No public open-source GB grid environment existed
3. Built 27-zone TNUoS model from NESO open data (ETYS Appendix B/F/G)
4. Added ERA5 weather climatology (140k hours, 27 zones, wind/solar/temperature)
5. Added NESO historic demand (17 years half-hourly TSD + interconnector flows)
6. Validated against NESO published boundary transfer percentiles
7. Discovered validation gap → investigated systematically across 16+ configurations
8. Found NESO uses 82 FLOP zones → extracted mapping from GSP boundaries
9. Found NESO uses LP-based dispatch with boundary limits (not DC power flow)
10. Built LOPF dispatch (HiGHS LP solver) to replicate NESO's approach
11. **Result**: Two validated environments (27-zone DCPF + 82-zone FLOP) with three dispatch baselines (simple, merit order, LOPF) ready for RL comparison

### Key insight for RL
The gap between merit order dispatch and LOPF dispatch IS the problem space for RL:
- Merit order: cheap but network-blind → boundary violations
- LOPF: network-aware but requires LP solver + full cost data
- RL agent: could learn a dispatch policy that approximates LOPF from experience, without needing explicit cost models or LP infrastructure

### What posts 1 and 2 proved
- Post 1 showed RL can learn dispatch fundamentals (demand matching, cost ordering)
- Post 2 showed that spatial observation without spatial action is a dead end
- Together they motivated the need for a topologically aware environment with per-zone actions
- The 3-action space (global increase/decrease/hold) was the bottleneck, not the network architecture

---

## 2. Environment Design

### State Space
Each timestep, the agent observes:

| Variable | Dimensions | Source | Range |
|----------|-----------|--------|-------|
| Wind CF per zone | 27 or 82 | ERA5 climatology | 0–1 |
| Solar CF per zone | 27 or 82 | ERA5 climatology | 0–1 |
| National demand | 1 | NESO TSD | 14,000–60,000 MW |
| Zone demand shares | 27 or 82 | demand_climatology.json | 0–0.22 |
| Installed capacity per zone per type | 27x7 or 82x7 | zones_tnuos/flop.json | MW |
| Current IC import | 1 | ic_lookup.json or dynamic | 0–100% |
| Season indicator | 4 (one-hot) | timestamp | binary |
| Year | 1 | scenario parameter | 2024–2035 |
| Boundary capabilities | 18 | etys_capabilities.json | MW |

**Total state dimension**: ~250 (27-zone) or ~750 (82-zone)

> Note: The tool uses 82 FLOP zones (not 84 as in early investigation notes).

Alternatively, a simpler state:
- National wind CF (scalar)
- National demand (scalar)
- Per-zone net injection from previous step (27 or 82)
- Boundary utilisations from previous step (18)
**Simpler total**: ~50-100

### Action Space

**Post 4 design** (full topology):
- Output fraction per zone per dispatchable type: 27 zones × 4 types (CCGT, OCGT, Biomass, Hydro) = 108 continuous actions in [0, 1]
- Must-run generation (wind, solar, nuclear) is not controllable — fixed by weather
- Interconnector import percentage: 1 continuous action in [0, 1]
- **Physical constraints on actions**:
  - Nuclear zones: output fixed at availability factor (not in action space)
  - Wind/solar zones: output fixed by weather (not in action space)
  - Thermal zones: bounded by [MSL, capacity] — action maps to this range
  - Storage zones: bounded by duration-derived CF cap

**Contrast with posts 1-2**: 3 discrete actions (global increase/decrease/hold) → 109 continuous actions (per-zone per-type). This is the fundamental change that enables topology-aware dispatch.

**Recommended algorithm**: PPO or SAC for continuous action spaces.

### Reward Function

Post 4 uses a hybrid multi-component reward:

```python
reward = -(
    w_cost * total_cost / 1e6                                          # Cost (£M)
    + w_viol * sum(max(0, util - 100) for util in boundary_utils)      # Violation penalty
    + w_bal  * abs(total_gen - total_demand) / total_demand             # Balance penalty
    + w_curt * wind_curtailed / max(total_wind, 1)                     # Curtailment penalty
)
```

Four agent variants from post 1 are replicated with different weight vectors:

| Agent | w_cost | w_viol | w_bal | w_curt | Expected behaviour |
|-------|--------|--------|-------|--------|-------------------|
| Cost-focused | 1.0 | 0.1 | 10 | 0.0 | Recovers merit order |
| Constraint-focused | 0.1 | 100 | 10 | 0.0 | Over-curtails, safe |
| Balanced | 1.0 | 100 | 10 | 0.1 | Should approach LOPF |
| Hybrid (final) | 1.0 | 50 | 10 | 0.5 | Best overall policy |

The hybrid reward is the post 4 contribution — the first three replicate post 1 but now with full topology.

### Episode Structure

**Option A: Single-step (snapshot)**
- Each episode is one weather/demand state
- Agent dispatches once, receives reward, episode ends
- Simplest to implement, matches current tool architecture
- Pro: fast training, many episodes
- Con: no temporal dynamics (no start-up costs, ramp rates)

**Option B: Multi-step (daily profile)**
- Episode = 24 or 48 consecutive hours
- Agent dispatches each hour, state transitions naturally
- Start-up costs apply when a generator turns on
- Ramp penalties when output changes >X MW/hour
- Pro: captures temporal dynamics
- Con: longer episodes, slower training, needs sequential weather data

**Option C: Curriculum**
- Start with Option A (learn basic dispatch)
- Graduate to Option B (learn temporal dynamics)
- Pro: faster initial learning, then refinement
- Con: more complex training pipeline

**Recommended**: Start with Option A. If results are promising, add temporal dynamics.

---

## 3. Data Files Needed

### Core environment data (all in public/data/)

| File | Contents | Used for |
|------|----------|----------|
| `zones_tnuos.json` | 27 zones: generation by type, demand by year | State: installed capacity, demand baseline |
| `zones_flop.json` | 82 FLOP zones: same structure | Alternative higher-res environment |
| `links_tnuos.json` | 43 inter-zone links with reactances | DC power flow network |
| `links_tnuos_by_year.json` | Year-dependent link topology (2024-2035) | Network evolution scenarios |
| `links_flop.json` | 134 FLOP inter-zone links | FLOP network |
| `boundary_link_mapping.json` | 22 boundaries → crossing links | Constraint checking |
| `boundary_link_mapping_flop.json` | Same for FLOP zones | FLOP constraints |
| `etys_capabilities.json` | Boundary capabilities by year/scenario | Constraint limits |
| `climatology.json` | ERA5 wind/solar CF percentiles by zone/season | Weather state generation |
| `demand_climatology.json` | Demand percentiles by zone/season | Demand state generation |
| `ic_lookup.json` | Dynamic IC import % by wind/demand quintile | IC state |
| `marginal_costs.json` | Technology costs (SRMC, startup, ramp, MSL) | Reward calculation |
| `plants_tnuos.json` | 1,896 individual generators | Detailed plant-level dispatch |

### Training data (not in repo — too large)

| File | Size | Contents | Used for |
|------|------|----------|----------|
| `winter_validation_data.json` | 69 MB | 70k winter hours: per-zone wind CF, solar CF, national TSD, IC flows | Training episodes |
| `era5_zone_timeseries.npz` | 33 MB | 140k hours: all seasons, all variables | Extended training data |
| NESO demand CSVs (2009-2025) | ~300 KB each | Half-hourly TSD + IC flows | Ground truth demand |

### Optional validation data

| File | Contents |
|------|----------|
| Elexon BMRS data | Actual generator-level dispatch per half-hour (API available) |
| NESO constraint cost reports | Annual constraint costs by boundary |

---

## 4. Environment Implementation

### Gym-compatible wrapper

```python
import gymnasium as gym
import numpy as np
import json

class GBGridEnv(gym.Env):
    """GB electricity grid dispatch environment."""
    
    def __init__(self, zone_mode='tnuos', weather_data_path=None):
        super().__init__()
        
        # Load network data
        self.zones = load_json(f'public/data/zones_{zone_mode}.json')
        self.links = load_json(f'public/data/links_{zone_mode}.json')
        self.boundaries = load_json(f'public/data/boundary_link_mapping{"_flop" if zone_mode == "flop" else ""}.json')
        self.capabilities = load_json('public/data/etys_capabilities.json')
        self.costs = load_json('public/data/marginal_costs.json')
        
        # Load weather/demand episodes
        self.episodes = load_json(weather_data_path)  # winter_validation_data.json
        
        n_zones = len(self.zones)
        n_types = 4  # CCGT, OCGT, Biomass, Hydro (dispatchable)
        
        # State: wind_cf(n_zones) + solar_cf(n_zones) + demand(1) + prev_boundary_util(18)
        self.observation_space = gym.spaces.Box(
            low=-np.inf, high=np.inf, shape=(2*n_zones + 1 + 18,)
        )
        
        # Action: dispatch fraction per zone per dispatchable type + IC import
        self.action_space = gym.spaces.Box(
            low=0, high=1, shape=(n_zones * n_types + 1,)
        )
        
    def reset(self, seed=None):
        # Sample a random weather/demand episode
        self.current_episode = random.choice(self.episodes)
        obs = self._build_observation()
        return obs, {}
    
    def step(self, action):
        # Decode action into dispatch decisions
        dispatch = self._decode_action(action)
        
        # Run DC power flow
        flows = self._solve_dcpf(dispatch)
        
        # Compute boundary utilisations
        boundary_utils = self._compute_boundary_utils(flows)
        
        # Compute reward
        cost = self._compute_cost(dispatch)
        violations = sum(max(0, u - 100) for u in boundary_utils.values())
        balance_error = abs(sum(dispatch.values()) - self.current_demand)
        
        reward = -(cost/1e6 + 100*violations + 10*balance_error/self.current_demand)
        
        terminated = True  # Single-step episodes
        obs = self._build_observation()
        info = {'cost': cost, 'violations': violations, 'boundary_utils': boundary_utils}
        
        return obs, reward, terminated, False, info
```

### Using the existing JS engine from Python

Alternative: call the existing JS engine via Node subprocess:

```python
import subprocess, json

def run_scenario(params):
    """Call the JS scenarioRunner from Python."""
    cmd = ['node', '--input-type=module', '-e', f'''
    import {{ runScenario }} from "./src/engine/scenarioRunner.js";
    const data = {json.dumps(data_paths)};
    const result = runScenario({{ data, ...{json.dumps(params)} }});
    console.log(JSON.stringify({{
        flows: result.flows,
        boundaryUtilisation: result.boundaryUtilisation,
        totalGeneration: result.validationInfo.totalGeneration,
        totalDemand: result.validationInfo.totalDemand
    }}));
    ''']
    output = subprocess.check_output(cmd, cwd='.')
    return json.loads(output)
```

### Pure Python implementation (recommended for training speed)

Reimplement the DC power flow in Python/NumPy for training speed:

```python
import numpy as np
from scipy.sparse.linalg import spsolve

class DCPowerFlow:
    def __init__(self, links, zones):
        # Pre-build admittance matrix (done once)
        self.B = build_admittance_matrix(links, zones)
        self.B_factored = splu(self.B)  # LU factorization (done once)
    
    def solve(self, injections):
        # Solve B @ theta = P (reuses LU factorization)
        theta = self.B_factored.solve(injections)
        flows = compute_flows(theta, self.links)
        return flows
```

This is already built in `scripts/validation/` — the validation scripts have working Python DC power flow.

---

## 5. Experiment Differentials

### Baseline comparisons (post 4)

| Agent/Method | Description | Expected performance |
|-------------|-------------|---------------------|
| **Random** | Random dispatch fractions | Terrible — massive violations and cost |
| **Simple** | All generation at 100% | High cost, no demand matching, violations |
| **Merit Order** | Cheapest first, demand-matched | Good cost, boundary violations |
| **LOPF** | LP-optimal with constraints | Best cost subject to constraints (upper bound) |
| **Post 1 MLP** | 3-action flat agent | Learns demand matching, no spatial awareness |
| **Post 2 CNN** | Spatial obs, 3 actions | Same convergence as post 1 (action bottleneck) |
| **Post 4 Agent** | Full topology, 109 actions | Should approach LOPF without explicit LP |

### Resolution experiments

| Env | Zones | State dim | Action dim | Notes |
|-----|-------|-----------|------------|-------|
| TNUoS-27 | 27 | ~75 | ~109 | Faster training, B6F validated well |
| FLOP-82 | 82 | ~200 | ~329 | Better boundary resolution, slower |
| Hybrid | 27 state + 82 dispatch | ~75 state | ~109 | Train on coarse, validate on fine |

### Reward function experiments

| Variant | Focus | Expected behaviour |
|---------|-------|-------------------|
| Cost-only | Minimise £ | Agent learns merit order (ignores constraints) |
| Constraint-only | Zero violations | Agent over-curtails (expensive but safe) |
| Balanced | Cost + constraints | Agent learns LOPF-like policy |
| Hybrid (post 4) | All four components | Best overall — the contribution |
| Adaptive penalty | Increase violation penalty over training | Curriculum: learn dispatch first, then constraints |

### Weather scenario experiments

| Training data | Episodes | Coverage |
|--------------|----------|----------|
| Winter only | 70k hours | Highest stress, most relevant |
| All seasons | 140k hours | More diverse, better generalisation |
| 2013 only | 6.5k hours | Matches NESO validation year |
| Extreme only | ~7k hours (p90+ wind) | Focus on constraint-binding scenarios |

### Temporal experiments (if extending to multi-step)

| Feature | Implementation | Effect |
|---------|---------------|--------|
| Start-up cost | Penalise turning on a generator that was off | Agent learns to keep baseload running |
| Ramp penalty | Penalise large output changes between steps | Agent learns smooth dispatch profiles |
| Storage | Battery charge/discharge state | Agent learns arbitrage (charge low-wind, discharge high-demand) |
| IC dynamics | IC import responds to wind/demand | Agent learns when imports are available |

---

## 6. Expected Outcomes and Framing

### What "success" looks like

1. **RL matches LOPF on cost** within ~5% while maintaining zero boundary violations
   - This proves the agent learned the constraint structure
   
2. **RL generalises to unseen weather** — trained on 2009-2022, tested on 2023-2024
   - This proves the agent learned the physics, not just memorised patterns

3. **RL adapts to network changes** — trained on 2024 topology, tested on 2028 (with reinforcements)
   - This proves the agent can handle evolving networks

4. **Post 4 agent outperforms post 1 agent** — same reward function, but topology-aware actions
   - This is the direct comparison that justifies the environment build

### What "failure" looks like (and why it's still interesting)

1. **RL can't match LOPF** — the LP is provably optimal for linear systems; RL has approximation error
   - Framing: "RL achieves X% of LOPF performance without requiring explicit cost data or solver infrastructure"

2. **RL violates boundaries** — the agent hasn't fully learned the constraint structure
   - Framing: "The agent learned cost-efficient dispatch but requires safety constraints as a hard overlay"

3. **RL only works at 27 zones, not 82** — action space too large for 82-zone dispatch
   - Framing: "Reduced-order models are sufficient for RL dispatch; higher resolution is needed only for boundary analysis"

4. **Post 4 agent doesn't outperform post 1** — topology didn't help
   - Framing: "For aggregate dispatch decisions, network topology is not a useful inductive bias — the national supply-demand balance dominates. Topology only matters for boundary-specific constraint management."

### The 4-post LinkedIn narrative

- **Post 1**: "I trained 4 RL agents to dispatch the GB power grid. Here's what they learned." (MLP baseline, different reward focuses, convergence results)
- **Post 2**: "I added CNNs and weather forecasts. It didn't help. Here's why." (Honest failure, spatial obs without spatial actions)
- **Post 3**: "So I built the environment myself." (The grid tool — screenshot-first, interactive demo link)
- **Post 4**: "Now the agent can see the network. Everything changed." (Full topology results, comparison against all baselines including LOPF)

---

## 7. Quick Start Checklist

### Minimum viable RL experiment (post 4)

- [ ] Copy `public/data/zones_tnuos.json`, `links_tnuos.json`, `boundary_link_mapping.json`, `etys_capabilities.json`, `marginal_costs.json` to RL project
- [ ] Copy `scripts/winter_validation_data.json` (70k episodes)
- [ ] Implement Python DC power flow (copy from validation scripts)
- [ ] Implement Gym environment wrapper
- [ ] Define state: wind_cf(27) + demand(1) = 28-dim
- [ ] Define action: dispatch_fraction(27x4) + IC(1) = 109-dim continuous
- [ ] Define reward: hybrid multi-component (cost + violations + balance + curtailment)
- [ ] Train PPO (stable-baselines3) for 1M steps
- [ ] Compare against merit order, LOPF, and post 1/2 baselines
- [ ] Plot: training curve, cost distribution, boundary violation frequency
- [ ] Direct comparison: post 1 (3 actions) vs post 4 (109 actions) on same reward function

### Files to copy to RL project

```
public/data/zones_tnuos.json          # Zone capacities and demand
public/data/links_tnuos.json          # Network links (base year)
public/data/boundary_link_mapping.json # Boundary definitions
public/data/etys_capabilities.json    # Boundary limits
public/data/marginal_costs.json       # Generator costs
public/data/demand_climatology.json   # Demand percentiles
public/data/climatology.json          # Weather percentiles
scripts/winter_validation_data.json   # 70k training episodes (generate locally)
```

---

## 8. Key Numbers for Reference

| Metric | Value |
|--------|-------|
| TNUoS zones | 27 |
| FLOP zones | 82 |
| Inter-zone links (TNUoS) | 43 |
| Inter-zone links (FLOP) | 134 |
| ETYS boundaries | 22 (18 with crossing links) |
| Total built generation capacity | ~86 GW |
| Total built wind capacity | ~23 GW |
| ACS peak demand | 47,940 MW |
| Typical winter demand | ~36,000 MW |
| B6F capability (2024) | 7,200 MW |
| B6F capability (2035) | 16,800 MW |
| Real IC import mean | 1,611 MW (16.4%) |
| DCPF solve time (27 zones) | <1 ms |
| DCPF solve time (82 zones) | <5 ms |
| LOPF solve time (27 zones) | ~10 ms |
| Merit order validation (B6F p75) | -2% error |
| FLOP net injection validation (mean) | 68% mean error |
| Training episodes available | 70,000 (winter) / 140,000 (all seasons) |
| Post 1 action space | 3 discrete |
| Post 4 action space | 109 continuous |
