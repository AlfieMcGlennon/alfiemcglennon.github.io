"""Generate the 1200x630 Open Graph social-share card for the copulas post.

Complements copula_viz.py (which renders the in-post figures). This card is
the image that LinkedIn / Slack / Twitter / Google show when the post URL is
shared, so it must be exactly 1200x630 to match the og:image:width/height
declared in Base.astro. We therefore save WITHOUT bbox_inches='tight'
(which would crop to content and change the dimensions): figsize=(12, 6.3)
at dpi=100 -> 1200x630 px.
"""

import os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

out = "C:/Website/alfiemcglennon.github.io/public/images/copulas"
os.makedirs(out, exist_ok=True)

BG = '#0f1523'
INK = '#e4e4e8'
MUTED = '#9ca3af'
SKY = '#38bdf8'
RED = '#d73027'
AMBER = '#ffb000'
ACCENT = '#ef8a62'

np.random.seed(7)


def clayton_sample(n, theta):
    u1 = np.random.uniform(0, 1, n)
    w = np.random.uniform(0, 1, n)
    u2 = (u1 ** (-theta) * (w ** (-theta / (1 + theta)) - 1) + 1) ** (-1 / theta)
    return u1, np.clip(u2, 0, 1)


# Survival Clayton -> upper-tail dependence: the compound-extremes pattern.
u, v = clayton_sample(2200, 2.6)
u, v = 1 - u, 1 - v

fig = plt.figure(figsize=(12, 6.3), dpi=100)
fig.patch.set_facecolor(BG)

# Right-hand copula scatter, with the joint-exceedance cluster picked out.
ax = fig.add_axes([0.545, 0.135, 0.39, 0.73])
ax.set_facecolor(BG)
ax.scatter(u, v, s=7, alpha=0.30, c=SKY, edgecolors='none')
mask = (u > 0.9) & (v > 0.9)
ax.scatter(u[mask], v[mask], s=13, c=RED, alpha=0.85, edgecolors='none')
ax.axvline(0.9, color=AMBER, ls='--', lw=1, alpha=0.5)
ax.axhline(0.9, color=AMBER, ls='--', lw=1, alpha=0.5)
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.set_xticks([])
ax.set_yticks([])
for s in ax.spines.values():
    s.set_edgecolor('#2a3142')
ax.set_xlabel('hazard 1', color=MUTED, fontsize=13)
ax.set_ylabel('hazard 2', color=MUTED, fontsize=13)
ax.annotate('compound\nextremes', xy=(0.95, 0.95), xytext=(0.60, 0.66),
            color=RED, fontsize=12, ha='left', va='center',
            arrowprops=dict(arrowstyle='->', color=RED, lw=1.2, alpha=0.8))

# Left-hand text block.
fig.text(0.063, 0.715, 'Copulas in', fontsize=47, color=INK, weight='bold')
fig.text(0.063, 0.595, 'Climate Risk', fontsize=47, color=ACCENT, weight='bold')
fig.text(0.064, 0.475, "Why extremes don't happen alone",
         fontsize=20, color=MUTED)
fig.add_artist(Rectangle((0.064, 0.40), 0.165, 0.009,
                         transform=fig.transFigure, color=ACCENT, zorder=5))
fig.text(0.064, 0.165, 'Alfie McGlennon', fontsize=17, color=INK, weight='bold')
fig.text(0.064, 0.105, 'alfiemcglennon.com', fontsize=14, color=SKY,
         family='monospace')

path = f'{out}/og-card.png'
fig.savefig(path, dpi=100, facecolor=BG)
plt.close()

# Verify exact pixel dimensions straight from the PNG IHDR chunk.
with open(path, 'rb') as f:
    head = f.read(24)
w = int.from_bytes(head[16:20], 'big')
h = int.from_bytes(head[20:24], 'big')
print(f'Wrote {path}  ->  {w}x{h} px')
