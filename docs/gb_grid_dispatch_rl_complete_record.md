# GB Grid Dispatch RL — Complete Technical Record
## Everything built, learned, and decided across Post 1 (MLP) and Post 2 (CNN)

---

## 1. PROJECT OVERVIEW

### 1.1 What This Is
A series of reinforcement learning agents trained to dispatch the Great Britain electricity grid. The agents control gas generation, imports, and storage to meet demand after renewables and nuclear have generated. Built entirely from public data over approximately two weeks.

### 1.2 Who Built It
Alfie McGlennon, MSc Climate Change & AI, University of Reading. Supervisors: Kieran Hunt (ML), Andrew Charlton-Perez (atmospheric circulation). Targeting industry roles in reinsurance/climate risk analytics (Swiss Re, Munich Re, Moody's RMS, Verisk, ECMWF).

### 1.3 Infrastructure
- **Training:** University of Reading RACC HPC cluster (username ir801815)
  - GPU partition: gpuscavenger (racc2-gpu-[0-3])
  - Max 1 running GPU job, 3 queued
  - 20 GB home directory storage
  - Conda environment: `energy` (SB3, PyTorch, zarr, numpy, etc.)
- **Local development:** Windows machine, OneDrive sync
  - Local path: `C:\Users\alfie\OneDrive\Documents\Fun\Reinforcement\`
  - Cannot evaluate locally — Jupyter kernel crashes loading 2.2GB zarr
- **SSH access:** `ssh -F /drives/c/Users/alfie/.ssh/config racc` via arc-ssh proxy
- **RACC conda activation sequence:**
  ```bash
  source /etc/profile.d/modules.sh
  module load anaconda/2023.09-0/base
  eval "$(conda shell.bash hook 2>/dev/null)" || true
  conda activate energy
  ```

### 1.4 Tools & Libraries
- Stable-Baselines3 (PPO)
- PyTorch (GPU training)
- Gymnasium (environment interface)
- Zarr (spatial data storage)
- ERA5 reanalysis via CDS API / Earth Data Hub
- NESO generation data, Elexon wholesale prices
- REPD (Renewable Energy Planning Database) for farm locations

---

## 2. DATA SOURCES

### 2.1 Generation Data (NESO)
- **Coverage:** 2015 to mid-2024, hourly
- **Fuel types (10):** Gas, coal, nuclear, wind, solar, hydro, biomass, imports, storage, other
- **Used as:** Observation features (slots 0-9 in scalar vector), NESO baseline for cost comparison
- **NESO 2024 baseline:** £10.76B total dispatch cost, 30.1 Mt emissions

### 2.2 Demand Data (NESO)
- **Coverage:** Same period, hourly
- **Used as:** Observation feature (slot 10 in scalar vector), target for dispatch
- **Key stat:** Typical demand range ~20-50 GW

### 2.3 Price Data (Elexon)
- **Coverage:** Same period, hourly wholesale prices
- **Used as:** Observation features (4 price slots), cost computation in environment

### 2.4 Weather Data (ERA5)
- **Spatial dataset:** `gb_spatial_complete.zarr`
  - Shape: (87672, 12, 37, 41) — 87,672 hourly timesteps, 12 channels, 37 lat × 41 lon
  - Resolution: 0.25° (~28km)
  - Coverage: 2015 to mid-2024
  - **12 channels:**
    - 8 weather: t2m (2m temperature), d2m (2m dewpoint), msl (mean sea level pressure), z500 (500hPa geopotential), swvl1 (soil moisture), si100 (100m wind speed), ssrd (surface solar radiation), tcc (total cloud cover)
    - 4 static: wind_capacity, solar_capacity, terrain, pop_density
  - Size: ~1.4 GB on RACC, ~2.2 GB local
- **Scalar weather features:** National averages extracted from ERA5, used in MLP observation vector
- **Forecast stacking:** Environment stacks base channels across lead times with ECMWF-calibrated noise:
  - `[0]` → 12 channels (T+0 only)
  - `[0, 3]` → 24 channels
  - `[0, 3, 12, 24]` → 48 channels
  - `[0, 3, 12, 24, 72, 168]` → 72 channels (full, up to 7 days)

### 2.5 Renewable Farm Locations (REPD)
- 804 wind projects totalling 27.5 GW
- 1,370 solar projects totalling 10.7 GW
- Rasterised to ERA5 grid as channels 8 (wind_capacity) and 9 (solar_capacity)
- Lat/lon available for zone-level aggregation

---

## 3. POST 1 — MLP AGENTS

### 3.1 Architecture

**Algorithm:** PPO (Proximal Policy Optimization) via Stable-Baselines3

**Observation space:** 70 scalar features (padded to fixed length)
- Generation × 10 fuel types (MW)
- Demand (MW)
- Battery SOC, pumped SOC
- Time features: hour sin/cos, month
- Price × 4 + import price
- Previous gas dispatch
- Wind/solar/demand forecasts at 3 lead times
- Ramp state

**Action space:** 3 continuous values
- `gas_frac` (0 to 1): fraction of residual demand to fill with gas
- `import_frac` (0 to 1): fraction of residual demand to fill with imports
- `storage_frac` (-1 to 1): charge (positive) or discharge (negative)

**Critical mechanic:** `residual = max(0, demand - non_dispatchable)`. Gas and imports are fractions of the residual. gas_frac + import_frac can exceed 1.0, which causes oversupply and curtailment.

**Network:** Standard MLP (SB3 default policy network)
- Policy head: [256, 256]
- Value head: [256, 256]

**Training:**
- 9 years of data (2015-2024), hourly
- 5M timesteps per agent
- Gas ramp rate constraint: 5 GW/hr (changed from 10 GW which was never binding)
- Gas minimum stable generation (MSG): 5 GW
- Max gas capacity: ~25 GW
- Max import capacity: 9.9 GW (sum of all interconnectors)
- Curriculum learning: episode length ramps from short to full year

### 3.2 Four Agent Types

**Cost-only reward:**
```python
reward = unmet_penalty + curtail_penalty + cost_reward + ramp_penalty
```
Where:
- `unmet_penalty = -100.0 * (unmet / demand)` — very heavy
- `curtail_penalty = -5.0 * (curtailed / demand)`
- `cost_reward = -cost / 1e6`
- `ramp_penalty = -0.5 if gas_ramp_limited else 0`

**Reliable reward:** Cost-only + margin penalty
```python
+ margin_penalty  # triggers when margin < 20%
margin_penalty = -15.0 * ((0.20 - margin) / 0.20)^2
```

**Weather-aware reward:** Cost-only + weather-scaled margin
```python
+ margin_penalty * weather_multiplier
weather_multiplier = 1.0 + min(3.0, weather_stress * 3.0)  # up to 4×
```

**Green reward:** Modified weights + emissions
```python
cost_reward * 0.5 + emissions_penalty + margin_penalty * weather_multiplier
```

### 3.3 MLP Results

| Agent | Cost vs NESO | Gas% | Imports% | Emissions |
|-------|-------------|------|----------|-----------|
| Cost | +6.2% | 99.7% | 0.3% | 47.9 Mt |
| Reliable | +6.4% | 100% | 0% | 48.0 Mt |
| Weather | +13.1% | 97.8% | 8.1% | 48.1 Mt |
| Green | +34.1% | 77.6% | 47.4% | 39.8 Mt |

**Key finding:** The 5 GW gas ramp rate constraint forced strategy divergence. Without it (at 10 GW), all four agents converged to identical gas=100% strategies. The constraint created intelligence.

### 3.4 LinkedIn Post 1 Performance
- 2,158 impressions / 1,417 members reached
- 27 reactions / 5 comments / 11 saves
- 15 followers gained / 21 profile viewers
- Key engagers: ECMWF Director-General (Pappenberger), ECMWF scientist (Balsamo), NESO Data Scientist (Arijit Mondal), supervisor Kieran Hunt
- Senior seniority 39%, Research Services 13%, ECMWF top company 3%

---

## 4. POST 2 — CNN AGENTS

### 4.1 Architecture

**Algorithm:** PPO with custom feature extractor

**Observation space (Dict):**
- `'spatial'`: Box(C, 37, 41) where C = 12 × number of forecast windows (12 to 72 channels)
- `'scalar'`: Box(90) padded vector (32 active features)

**Action space:** Same 3 continuous values as MLP (gas_frac, import_frac, storage_frac)

**Custom Feature Extractor — `SpatialScalarExtractor`:**
```
Spatial branch (CNN):
  Conv2d(C_in, 32, 3, padding=1) → ReLU → MaxPool(2)   → (32, 18, 20)
  Conv2d(32, 64, 3, padding=1)   → ReLU → MaxPool(2)    → (64, 9, 10)
  Conv2d(64, 64, 3, padding=1)   → ReLU → AdaptiveAvgPool(4,4) → (64, 4, 4)
  Flatten → Linear(1024, 128) → ReLU
  Output: 128-dim vector

Scalar branch (MLP):
  Linear(90, 64) → ReLU → Linear(64, 64) → ReLU
  Output: 64-dim vector

Combined: concat(128 + 64) = 192-dim → policy/value heads [256, 256]
```

**Total parameters:** 448,807
- CNN branch: 207,392
- Scalar branch: 9,984
- Policy/Value heads: 231,431

**Training configuration:**
```python
LEARNING_RATE = 3e-4 → 5e-6 (linear schedule)
GAMMA = 0.99
N_STEPS = 8192
BATCH_SIZE = 64
N_EPOCHS = 5
GAE_LAMBDA = 0.95
ENT_COEF = 0.01
CLIP_RANGE = 0.2
```

**VecNormalize:** norm_obs=False, norm_reward=True, clip_reward=10.0

### 4.2 CNN Cost-Only Experiments

Every variant produced identical results regardless of:
- Channel count (12 → 24 → 48 → 72)
- Forecast windows (T+0 through T+168h)
- Transfer learning vs fresh training
- Weather-aware reward modification

| Run | Channels | Forecasts | Cost vs NESO | Gas% | Imports% | Emissions |
|-----|----------|-----------|-------------|------|----------|-----------|
| 12ch cost_only | 12 | T+0 | +6.3% | 100.2% | 0.0% | 48.14 Mt |
| 24ch fresh | 24 | T+0, T+3 | +6.3% | 100.2% | 0.0% | 48.13 Mt |
| 24ch transfer | 24 | T+0, T+3 | +6.3% | 100.2% | 0.0% | 48.13 Mt |
| 48ch weather | 48 | T+0 to T+24 | +6.1% | 100.2% | 0.0% | 48.05 Mt |
| 48ch transfer | 48 | T+0 to T+24 | +6.1% | 100.2% | 0.0% | 48.05 Mt |
| 72ch full | 72 | T+0 to T+168 | +6.1% | 100.2% | 0.0% | 48.05 Mt |

**Core finding:** The cost-only reward has one dominant strategy so strong that additional spatial data, forecast windows, and transfer learning cannot shift it. The CNN cost-only agent converges to the same gas=100% strategy as the MLP. The problem was never data — it was reward design and action space.

### 4.3 Reward Engineering Experiments

#### 4.3.1 Composite Reward
```python
cost_reward * 0.3                              # Cost weight reduced
-emis_rate / 200.0                             # Emissions intensity penalty
import_frac * 3.0                              # Unconditional import bonus
-max(0, gas_frac - 0.75)^2 * 20.0             # Quadratic gas dominance penalty
margin_penalty * weather_multiplier            # Weather-scaled margin
```

**Result:** Gas 70%, Imports 61%, Cost +44%, 50 TWh curtailed, 37.0 Mt emissions

**Failure mode:** Agent stacked gas AND imports to collect the import bonus, dumping excess as curtailment. Found the loophole, not the trade-off. The unconditional import bonus was the design flaw.

#### 4.3.2 Anticipatory Reward
Same as composite but with added bonus for ramping gas down when wind forecast shows generation increasing.

**Result:** Gas 85%, Imports 67%, Cost +49%, 61 TWh curtailed, 40.4 Mt emissions

**Failure mode:** Most reliable agent (lowest unmet demand) but most conservative. Over-dispatched as insurance against forecast uncertainty.

#### 4.3.3 Rebalanced Reward
Harsher curtailment penalties, lower import bonuses.

**Result:** Gas 68%, Imports 54%, Cost +24%, 27 TWh curtailed, 32.6 Mt emissions, 880k MWh unmet

**Failure mode:** Best cost of the composite variants but undersupplied demand. The harsher curtailment penalty pushed the agent away from oversupply but overcorrected.

#### 4.3.4 Spatial Balanced Reward (Final)
```python
cost_term = cost_reward * 0.5                  # Higher cost weight

# Smooth balance penalty (symmetric quadratic)
dispatch_ratio = total_dispatched / residual
balance_penalty = -15.0 * (dispatch_ratio - 1.0)^2

# Anticipatory spatial signal
forecast_delta = compare T+0 vs T+3h wind at farm locations
if forecast_delta > 0:  # renewables ramping up
    anticipatory_term = -forecast_delta * gas_share * 3.0
else:  # renewables dropping
    anticipatory_term = -forecast_delta * gas_share * 0.5

# Gentle import preference
import_bonus = import_share * 0.8

# Gas dominance shaping (linear from 65%)
gas_dom = -max(0, gas_share - 0.65) * 2.0
```

**Design principles:**
- Cost weight 0.5 (not 0.3 — keeps cost honest)
- No unconditional import bonus (prevents stacking loophole)
- Smooth symmetric balance penalty (prevents over/undersupply oscillation)
- Anticipatory signal uses spatial farm channels + forecast weather (the only signal that requires both)
- Linear gas shaping from 65% (no cliff edge like composite's quadratic from 75%)

**Result:** Gas 85.3%, Imports 26.1%, Cost +12.8% vs NESO, 40.5 Mt emissions, 13.7 TWh curtailed, 347k MWh unmet

**Assessment:** Best compromise of any variant. Lowest cost premium of any diversified agent. Meaningful import usage without oversupply. Emissions down 16% from cost-only. But still not good enough — three national actions cannot precisely balance a spatially distributed system.

**Training:** 12M steps, 72 channels, ~12 hours on RACC GPU

### 4.4 Training Infrastructure Lessons

#### Dead Critic
- First composite run: explained variance at zero for 7M steps
- Cause: six reward terms on vastly different scales overwhelmed the value function
- Fix: VecNormalize(norm_reward=True) — explained variance jumped to 0.89
- Lesson: multi-term rewards REQUIRE reward normalisation

#### Broken Transfer Learning
- Transfer learning locked policies completely
- Cause: VecNormalize running statistics not saved alongside model weights
- Symptom: KL divergence above 2.0, 85%+ of gradient updates clipped, policy frozen
- Fix: always save vecnormalize.pkl with final_model.zip
- Lesson: VecNormalize stats are part of the model, not optional metadata

#### Entropy Runaway
- 72-channel input with default entropy coefficient (0.0115)
- Symptom: policy standard deviation climbed from 1 to 12 during training
- The agent explored MORE over time instead of converging
- Fix: reduce entropy coefficient to 0.008-0.01
- Lesson: larger observation spaces need tighter entropy control

#### Other Technical Lessons
- DEFAULT_CHANNELS in environment must match zarr channels (cost: 2 wasted runs when env defaulted to 8 but zarr had 12)
- 10 GW/hr gas ramp rate is never binding — changed to 5 GW
- Resume training LR must be 1e-4 not 3e-4 (higher LR destabilises transferred weights)
- 100-feature padded observation with 78 zeros drowns gradient signal (reduced to 90 padded, 32 active)
- Em dashes in Python cause SyntaxError on Linux (check for non-ASCII before SCP)
- OneDrive locks zarr files (save to C:\Temp first, then copy)
- SLURM conda activation needs `|| true` on the eval line to prevent script exit

### 4.5 LinkedIn Post 2 Performance
- 231 impressions / 121 members reached (at 1 day)
- 5 reactions / 0 comments / 1 save
- 2 profile viewers / 0 followers gained
- Significantly underperformed Post 1

**Post-mortem:** The "I got it wrong" failure framing suppressed initial engagement, which killed LinkedIn's algorithm distribution. The algorithm decides in the first 1-2 hours whether to push wider based on early reactions. Technically strong post, wrong platform dynamics.

**Lesson for Post 3:** Lead with something visually impressive. Front-load the win. Bury failure callbacks mid-post. The grid tool with an interactive map is inherently visual — use that.

---

## 5. FILE STRUCTURE

### 5.1 RACC
```
~/energy/CNN/
├── Code/
│   ├── environment_cnn_v2.py          # Main environment (all reward types including spatial_balanced)
│   ├── environment_cnn_v2.py.bak      # Backup before spatial_balanced patch
│   ├── train_cnn_v2.py                # Training script with argparse
│   ├── expand_cnn.py                  # Conv layer expansion for transfer learning
│   ├── apply_spatial_patch.py         # Auto-patcher for spatial_balanced reward
│   └── spatial_reward_patch.py        # Reference/documentation for the reward
├── Data/
│   └── gb_spatial_complete.zarr       # 12ch, 87672 timesteps, ~1.4 GB
├── models_v2/
│   ├── cost_only/                     # 12ch cost_only (Stage 1 final)
│   │   ├── final_model.zip
│   │   └── (no vecnormalize — early run)
│   ├── composite/                     # 72ch composite reward
│   │   ├── final_model.zip
│   │   └── vecnormalize.pkl
│   ├── composite_transfer_3M/         # Composite with transfer, 3M steps
│   ├── anticipatory/                  # 72ch anticipatory reward
│   │   ├── final_model.zip
│   │   └── vecnormalize.pkl
│   ├── anticipatory_v2/               # Rebalanced anticipatory
│   │   ├── final_model.zip
│   │   └── vecnormalize.pkl
│   ├── spatial_balanced/              # 72ch spatial_balanced (final best)
│   │   ├── final_model.zip
│   │   ├── vecnormalize.pkl
│   │   ├── checkpoints/
│   │   └── best/
│   ├── weather_48ch/                  # 48ch weather-aware
│   │   └── final_model.zip
│   └── stage1_5gw_12ch_final.zip     # Standalone backup
├── logs_v2/
│   ├── cnn_spatial_balanced_293740.log   # Successful spatial_balanced run
│   ├── cnn_spatial_balanced_293739.log   # Failed run (wrong args)
│   ├── cnn_anticipatory_288949.log
│   ├── cnn_composite_v2_286016.log
│   └── (various other logs)
└── run_spatial_balanced.sh
```

### 5.2 Local (Windows)
```
C:\Users\alfie\OneDrive\Documents\Fun\Reinforcement\
├── CNN\
│   ├── Code\
│   │   ├── environment_cnn_v2.py
│   │   ├── train_cnn_v2.py
│   │   ├── expand_cnn.py
│   │   └── build_complete_zarr.py
│   ├── Data\processed\
│   │   └── gb_spatial_complete.zarr   # Full 12ch zarr (~2.2 GB)
│   └── models_v2\
│       └── cost_only_racc\            # Downloaded from RACC
├── GNN\
│   └── Code\
│       ├── apply_spatial_patch.py
│       ├── spatial_reward_patch.py
│       └── run_spatial_balanced.sh
└── MLP\
    └── (Post 1 code and models)
```

---

## 6. EVALUATION TEMPLATES

### 6.1 CNN Agent Evaluation (with VecNormalize)
```python
import warnings; warnings.filterwarnings('ignore')
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv, VecNormalize
from environment_cnn_v2 import GBGridDispatchCNNv2Env

AGENT = 'spatial_balanced'  # or composite, anticipatory, etc.
FORECAST_HOURS = [0, 3, 12, 24, 72, 168]

def make_env():
    return GBGridDispatchCNNv2Env(
        reward_type=AGENT, train=False, forecast_noise=True,
        max_episode_length=8760, spatial_forecast_hours=FORECAST_HOURS
    )

env = DummyVecEnv([make_env])
env = VecNormalize.load(f'../models_v2/{AGENT}/vecnormalize.pkl', env)
env.training = False
env.norm_reward = False

model = PPO.load(f'../models_v2/{AGENT}/final_model', env=env, device='cpu')
obs = env.reset()
g = i = u = c = cu = e = d = n = 0
for step in range(8760):
    a, _ = model.predict(obs, deterministic=True)
    obs, r, done, info = env.step(a)
    x = info[0]
    g += x['dispatch']['gas']
    i += x['dispatch']['imports']
    u += x['dispatch']['unmet']
    c += x['dispatch']['cost']
    cu += x['dispatch']['curtailed']
    e += x['dispatch']['emissions']
    d += x['dispatch']['total_demand']
    n += x['dispatch']['non_dispatchable']
    if done[0]: break

h = step + 1
rs = max(0, d - n)
print(f'{AGENT} - {h}h:')
print(f'  Cost: {c/1e9:.2f}B [{(c/1e9-10.76)/10.76*100:+.1f}% vs NESO]')
print(f'  Unmet: {u:,.0f} MWh  Curtailed: {cu:,.0f} MWh')
print(f'  Gas: {g/(rs+1)*100:.1f}%  Imports: {i/(rs+1)*100:.1f}%')
print(f'  Emissions: {e/1e9:.2f} Mt')
```

### 6.2 CNN Agent Evaluation (without VecNormalize — cost_only)
```python
# Same as above but skip VecNormalize.load:
env = DummyVecEnv([make_env])
# No VecNormalize wrapping
model = PPO.load(f'../models_v2/{AGENT}/final_model', env=env, device='cpu')
```

### 6.3 Batch Evaluation (all agents)
Use the backup environment for agents trained before spatial_balanced was added:
```bash
cp environment_cnn_v2.py environment_cnn_v2_patched.py
cp environment_cnn_v2.py.bak environment_cnn_v2.py
# Run evals
cp environment_cnn_v2_patched.py environment_cnn_v2.py
```

---

## 7. COMPLETE RESULTS TABLE

| Run | Type | Channels | Forecasts | Cost vs NESO | Gas% | Imports% | Emissions | Curtailed | Unmet |
|-----|------|----------|-----------|-------------|------|----------|-----------|-----------|-------|
| MLP Cost | MLP | n/a | n/a | +6.2% | 99.7% | 0.3% | 47.9 Mt | ~0 | ~0 |
| MLP Reliable | MLP | n/a | n/a | +6.4% | 100% | 0% | 48.0 Mt | ~0 | ~0 |
| MLP Weather | MLP | n/a | n/a | +13.1% | 97.8% | 8.1% | 48.1 Mt | — | — |
| MLP Green | MLP | n/a | n/a | +34.1% | 77.6% | 47.4% | 39.8 Mt | — | — |
| CNN 12ch | CNN | 12 | T+0 | +6.3% | 100.2% | 0.0% | 48.14 Mt | ~0 | ~0 |
| CNN 24ch fresh | CNN | 24 | T+0,T+3 | +6.3% | 100.2% | 0.0% | 48.13 Mt | ~0 | ~0 |
| CNN 24ch transfer | CNN | 24 | T+0,T+3 | +6.3% | 100.2% | 0.0% | 48.13 Mt | ~0 | ~0 |
| CNN 48ch weather | CNN | 48 | T+0-T+24 | +6.1% | 100.2% | 0.0% | 48.05 Mt | ~0 | ~0 |
| CNN 48ch transfer | CNN | 48 | T+0-T+24 | +6.1% | 100.2% | 0.0% | 48.05 Mt | ~0 | ~0 |
| CNN 72ch full | CNN | 72 | T+0-T+168 | +6.1% | 100.2% | 0.0% | 48.05 Mt | ~0 | ~0 |
| CNN Composite | CNN | 72 | T+0-T+168 | +44% | 70% | 61% | 37.0 Mt | 50 TWh | ~0 |
| CNN Anticipatory | CNN | 72 | T+0-T+168 | +49% | 85% | 67% | 40.4 Mt | 61 TWh | ~0 |
| CNN Rebalanced | CNN | 72 | T+0-T+168 | +24% | 68% | 54% | 32.6 Mt | 27 TWh | 880k MWh |
| CNN Spatial Balanced | CNN | 72 | T+0-T+168 | +12.8% | 85.3% | 26.1% | 40.5 Mt | 13.7 TWh | 347k MWh |

---

## 8. ENVIRONMENT CONSTANTS

```python
# Grid physical parameters
GAS_RAMP_RATE = 5000          # MW/hr (changed from 10000 which was never binding)
GAS_MSG = 5000                # MW minimum stable generation
MAX_GAS_CAPACITY = ~25000     # MW
MAX_IMPORT_CAPACITY = 9900    # MW (sum of all interconnectors)

# Reward common components
UNMET_PENALTY_COEF = -100.0   # Very heavy — ensures demand is met
CURTAIL_PENALTY_COEF = -5.0
COST_REWARD_DIVISOR = 1e6
RAMP_PENALTY = -0.5           # If gas ramp limited this step
MARGIN_THRESHOLD = 0.20       # 20% reserve margin trigger
MARGIN_PENALTY_COEF = -15.0
WEATHER_MULTIPLIER_MAX = 4.0  # 1.0 + min(3.0, stress * 3.0)

# Training defaults (from train_cnn_v2.py)
TOTAL_TIMESTEPS = 12_000_000  # Updated from 7M for spatial_balanced
LR_START = 3e-4
LR_END = 5e-6
LR_RESUME = 1e-4              # Lower for transfer learning
GAMMA = 0.99
N_STEPS = 8192
BATCH_SIZE = 64
N_EPOCHS = 5
GAE_LAMBDA = 0.95
ENT_COEF = 0.01               # Reduced from 0.0115 after entropy runaway
CLIP_RANGE = 0.2
CHECKPOINT_FREQ = 250_000

# Data splits
TRAIN_HOURS = 78888           # ~9 years
TEST_HOURS = 8784             # ~1 year (2024)
```

---

## 9. KEY DECISIONS AND RATIONALE

### 9.1 Why PPO?
- On-policy, stable, well-suited for continuous action spaces
- SB3 implementation is mature with VecNormalize, callbacks, checkpointing
- SAC or TD3 would be alternatives but PPO's clipping makes it more robust to reward engineering experiments

### 9.2 Why 5 GW ramp rate?
- 10 GW was never binding (demand changes ~2-3 GW/hr)
- 5 GW forces the agent to plan ahead — can't instantly switch from 0 to max gas
- This is what created strategy divergence in Post 1
- Real CCGT ramp rates are ~30-50 MW/min per unit, so 5 GW/hr for the fleet is approximately realistic

### 9.3 Why not SAC/TD3 for CNN?
- VecNormalize integration is cleaner with PPO in SB3
- PPO's on-policy nature means each training run is self-contained (no replay buffer persisting bad experiences)
- The problem is fundamentally about reward design, not sample efficiency

### 9.4 Why norm_obs=False?
- The spatial observations have physically meaningful scales (temperature in K, wind in m/s)
- Normalising observations would destroy the spatial channel relationships
- Reward normalisation (norm_reward=True) is what matters for multi-term rewards

### 9.5 Why 72 channels for the final runs?
- 12 base × 6 forecast windows (T+0, T+3h, T+12h, T+24h, T+72h, T+168h)
- Gives the CNN maximum information about future weather conditions
- The question was whether the agent could use it — answer: only with the right reward

### 9.6 Why spatial_balanced used forecast delta instead of absolute availability?
- Renewables are non-dispatchable and already subtracted from demand
- The agent already knows current wind/solar output from scalar observations
- Spatial channels are redundant for current conditions
- Their unique value is anticipatory: comparing T+0 vs T+3h weather at farm locations
- The forecast delta signal is the only thing that genuinely requires both spatial weather AND farm location channels

---

## 10. WHAT COMES NEXT — ZONAL RL

The complete plan for zone-level dispatch is in `zonal_rl_build_plan.md`. Summary:

- 27 TNUoS zones with per-zone dispatch decisions
- DC power flow computing boundary flows from net injections
- 29 continuous actions (gas_frac per zone + national imports + storage)
- Boundary violation penalties grounded in real network physics
- Data pipeline aggregating existing ERA5/REPD/TEC data per zone
- Training: 30M+ steps, likely 2× chained SLURM jobs

This is the environment that Post 2 said was needed. The grid tool provides the network model. The CNN work provides the training infrastructure and reward design lessons. Post 3 shows the tool and sets up the zonal RL results.
