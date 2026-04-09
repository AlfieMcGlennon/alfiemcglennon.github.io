import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.stats import norm, genextreme, lognorm
from scipy.stats import gamma as gamma_dist
from matplotlib.colors import LinearSegmentedColormap
from mpl_toolkits.mplot3d import Axes3D
import os

out = "C:/Website/alfiemcglennon.github.io/public/images/copulas"
os.makedirs(out, exist_ok=True)

plt.rcParams.update({
    'figure.facecolor': '#0f1523', 'axes.facecolor': '#0f1523',
    'text.color': '#e4e4e8', 'axes.labelcolor': '#9ca3af',
    'xtick.color': '#6b7280', 'ytick.color': '#6b7280',
    'axes.edgecolor': '#1e2030', 'grid.color': '#1e2030', 'grid.alpha': 0.5,
    'font.family': 'sans-serif', 'font.size': 11,
})
blue, sky, amber, red, violet = '#2b7cd4', '#38bdf8', '#ffb000', '#d73027', '#7c3aed'
cmap = LinearSegmentedColormap.from_list('copula', ['#2166ac', '#67a9cf', '#f7f7f7', '#ef8a62', '#b2182b'])
np.random.seed(42)

def gaussian_copula_sample(n, rho):
    z = np.random.multivariate_normal([0, 0], [[1, rho], [rho, 1]], n)
    return norm.cdf(z[:, 0]), norm.cdf(z[:, 1])

def clayton_copula_sample(n, theta):
    u1 = np.random.uniform(0, 1, n)
    w = np.random.uniform(0, 1, n)
    u2 = (u1**(-theta) * (w**(-theta/(1+theta)) - 1) + 1)**(-1/theta)
    return u1, np.clip(u2, 0, 1)

# 6. COPULA FAMILIES
print("Generating 6...")
fig, axes = plt.subplots(1, 3, figsize=(14, 4.5))

u, v = clayton_copula_sample(2000, 3.0)
axes[0].scatter(u, v, s=4, alpha=0.35, c='#ef8a62', edgecolors='none')
axes[0].fill_between([0, 0.3], 0, 0.3, alpha=0.08, color=red)
axes[0].set_title('Clayton ($\\theta$=3)\nLower tail dependence', color='#e4e4e8', fontsize=11)
axes[0].set_xlim(0, 1); axes[0].set_ylim(0, 1); axes[0].set_aspect('equal')
axes[0].set_xlabel('$u_1$'); axes[0].set_ylabel('$u_2$')

u, v = gaussian_copula_sample(2000, 0.7)
axes[1].scatter(u, v, s=4, alpha=0.35, c=sky, edgecolors='none')
axes[1].set_title('Gaussian ($\\rho$=0.7)\nSymmetric dependence', color='#e4e4e8', fontsize=11)
axes[1].set_xlim(0, 1); axes[1].set_ylim(0, 1); axes[1].set_aspect('equal')
axes[1].set_xlabel('$u_1$'); axes[1].set_ylabel('$u_2$')

u_c, v_c = clayton_copula_sample(2000, 4.0)
axes[2].scatter(1-u_c, 1-v_c, s=4, alpha=0.35, c='#a78bfa', edgecolors='none')
axes[2].fill_between([0.7, 1], 0.7, 1, alpha=0.08, color=violet)
axes[2].set_title('Survival Clayton\nUpper tail dependence', color='#e4e4e8', fontsize=11)
axes[2].set_xlim(0, 1); axes[2].set_ylim(0, 1); axes[2].set_aspect('equal')
axes[2].set_xlabel('$u_1$'); axes[2].set_ylabel('$u_2$')

plt.tight_layout()
plt.savefig(f'{out}/06-copula-families.png', dpi=180, bbox_inches='tight')
plt.close()

# 7. TAIL DEPENDENCE
print("Generating 7...")
fig, axes = plt.subplots(1, 2, figsize=(11, 5))
u, v = gaussian_copula_sample(8000, 0.7)
mask = (u > 0.8) & (v > 0.8)
axes[0].scatter(u[mask], v[mask], s=8, alpha=0.5, c=sky, edgecolors='none')
axes[0].axvline(0.95, color=red, ls='--', lw=1, alpha=0.7)
axes[0].axhline(0.95, color=red, ls='--', lw=1, alpha=0.7)
exceed = (u > 0.95) & (v > 0.95)
axes[0].scatter(u[exceed], v[exceed], s=15, c=red, alpha=0.8, edgecolors='none')
axes[0].set_xlim(0.8, 1); axes[0].set_ylim(0.8, 1)
axes[0].set_title(f'Gaussian: {exceed.sum()} joint extremes', color='#e4e4e8', fontsize=11)
axes[0].set_xlabel('$u_1$ (extreme tail)'); axes[0].set_ylabel('$u_2$ (extreme tail)')

u_c, v_c = clayton_copula_sample(8000, 4.0)
u_c, v_c = 1 - u_c, 1 - v_c
mask2 = (u_c > 0.8) & (v_c > 0.8)
axes[1].scatter(u_c[mask2], v_c[mask2], s=8, alpha=0.5, c='#a78bfa', edgecolors='none')
axes[1].axvline(0.95, color=red, ls='--', lw=1, alpha=0.7)
axes[1].axhline(0.95, color=red, ls='--', lw=1, alpha=0.7)
exceed2 = (u_c > 0.95) & (v_c > 0.95)
axes[1].scatter(u_c[exceed2], v_c[exceed2], s=15, c=red, alpha=0.8, edgecolors='none')
axes[1].set_xlim(0.8, 1); axes[1].set_ylim(0.8, 1)
axes[1].set_title(f'Upper-tail dependent: {exceed2.sum()} joint extremes', color='#e4e4e8', fontsize=11)
axes[1].set_xlabel('$u_1$ (extreme tail)'); axes[1].set_ylabel('$u_2$ (extreme tail)')

plt.tight_layout()
plt.savefig(f'{out}/07-tail-dependence.png', dpi=180, bbox_inches='tight')
plt.close()

# 8. THRESHOLD EXCEEDANCE CURVES
print("Generating 8...")
thresholds = np.linspace(0.8, 0.99, 30)
n = 50000
u_ind, v_ind = np.random.uniform(0, 1, n), np.random.uniform(0, 1, n)
u_g2, v_g2 = gaussian_copula_sample(n, 0.7)
u_t, v_t = clayton_copula_sample(n, 4.0)
u_t, v_t = 1 - u_t, 1 - v_t

joint_ind = [np.mean((u_ind > t) & (v_ind > t)) for t in thresholds]
joint_gauss = [np.mean((u_g2 > t) & (v_g2 > t)) for t in thresholds]
joint_tail = [np.mean((u_t > t) & (v_t > t)) for t in thresholds]

fig, ax = plt.subplots(figsize=(8, 5))
ax.semilogy(thresholds, joint_ind, color='#6b7280', lw=2, label='Independent', ls='--')
ax.semilogy(thresholds, joint_gauss, color=sky, lw=2, label='Gaussian ($\\rho$=0.7)')
ax.semilogy(thresholds, joint_tail, color=red, lw=2, label='Upper-tail dependent')
ax.set_xlabel('Threshold quantile')
ax.set_ylabel('P($U_1$ > t and $U_2$ > t)')
ax.set_title('Joint exceedance probability by dependence structure', color='#e4e4e8', fontsize=13)
ax.legend(frameon=False, fontsize=10)
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(f'{out}/08-threshold-exceedance.png', dpi=180, bbox_inches='tight')
plt.close()

# 9. SKLARS THEOREM
print("Generating 9...")
fig, axes = plt.subplots(1, 4, figsize=(16, 4))
x1 = np.linspace(-1, 6, 200)
gev_pdf = genextreme.pdf(x1, -0.2, loc=2, scale=1)
axes[0].fill_between(x1, gev_pdf, alpha=0.3, color=blue)
axes[0].plot(x1, gev_pdf, color=blue, lw=2)
axes[0].set_title('$F_1$: Wind (GEV)', color='#e4e4e8', fontsize=11)

x2 = np.linspace(0, 8, 200)
ln_pdf = lognorm.pdf(x2, 0.6, loc=0, scale=2)
axes[1].fill_between(x2, ln_pdf, alpha=0.3, color=violet)
axes[1].plot(x2, ln_pdf, color=violet, lw=2)
axes[1].set_title('$F_2$: Surge (Lognormal)', color='#e4e4e8', fontsize=11)

u, v = gaussian_copula_sample(1500, 0.75)
axes[2].scatter(u, v, s=3, alpha=0.3, c=sky, edgecolors='none')
axes[2].set_xlim(0, 1); axes[2].set_ylim(0, 1); axes[2].set_aspect('equal')
axes[2].set_title('$C$: Copula ($\\rho$=0.75)', color='#e4e4e8', fontsize=11)

wind = genextreme.ppf(u, -0.2, loc=2, scale=1)
surge = lognorm.ppf(v, 0.6, loc=0, scale=2)
axes[3].scatter(wind, surge, s=3, alpha=0.3, c=amber, edgecolors='none')
axes[3].set_title('$H$: Joint distribution', color='#e4e4e8', fontsize=11)

plt.tight_layout(w_pad=3)
plt.savefig(f'{out}/09-sklars-theorem.png', dpi=180, bbox_inches='tight')
plt.close()

# 10. 3D FAMILY COMPARISON
print("Generating 10...")
ug = np.linspace(0.02, 0.98, 60)
vg = np.linspace(0.02, 0.98, 60)
U, V = np.meshgrid(ug, vg)

fig = plt.figure(figsize=(15, 5))

ax1 = fig.add_subplot(131, projection='3d')
tc = 3.0
C_clay = (tc + 1) * (U * V)**(-tc - 1) * (U**(-tc) + V**(-tc) - 1)**(-1/tc - 2)
C_clay = np.clip(C_clay, 0, 8)
ax1.plot_surface(U, V, C_clay, cmap=cmap, alpha=0.85, edgecolor='none', rstride=2, cstride=2)
ax1.set_title('Clayton ($\\theta$=3)', color='#e4e4e8', fontsize=11, pad=10)
ax1.view_init(25, -50); ax1.set_zlim(0, 8)
for a in [ax1.xaxis, ax1.yaxis, ax1.zaxis]: a.pane.fill = False; a.pane.set_edgecolor('#1e2030')
ax1.tick_params(colors='#6b7280', labelsize=8)

ax2 = fig.add_subplot(132, projection='3d')
rho = 0.7
Xn, Yn = norm.ppf(U), norm.ppf(V)
det = 1 - rho**2
Zg = np.exp(-(Xn**2 - 2*rho*Xn*Yn + Yn**2)/(2*det)) / (2*np.pi*np.sqrt(det))
Cg = Zg / (norm.pdf(Xn) * norm.pdf(Yn))
Cg = np.clip(Cg, 0, 8)
ax2.plot_surface(U, V, Cg, cmap=cmap, alpha=0.85, edgecolor='none', rstride=2, cstride=2)
ax2.set_title('Gaussian ($\\rho$=0.7)', color='#e4e4e8', fontsize=11, pad=10)
ax2.view_init(25, -50); ax2.set_zlim(0, 8)
for a in [ax2.xaxis, ax2.yaxis, ax2.zaxis]: a.pane.fill = False; a.pane.set_edgecolor('#1e2030')
ax2.tick_params(colors='#6b7280', labelsize=8)

ax3 = fig.add_subplot(133, projection='3d')
nlU = -np.log(U); nlV = -np.log(V)
A = nlU**3.0 + nlV**3.0
Cv = np.exp(-A**(1/3.0))
du = ug[1] - ug[0]; dv = vg[1] - vg[0]
Cgum = np.gradient(np.gradient(Cv, du, axis=1), dv, axis=0)
Cgum = np.clip(Cgum, 0, 8)
ax3.plot_surface(U, V, Cgum, cmap=cmap, alpha=0.85, edgecolor='none', rstride=2, cstride=2)
ax3.set_title('Gumbel ($\\theta$=3)', color='#e4e4e8', fontsize=11, pad=10)
ax3.view_init(25, -50); ax3.set_zlim(0, 8)
for a in [ax3.xaxis, ax3.yaxis, ax3.zaxis]: a.pane.fill = False; a.pane.set_edgecolor('#1e2030')
ax3.tick_params(colors='#6b7280', labelsize=8)

plt.tight_layout()
plt.savefig(f'{out}/10-3d-family-comparison.png', dpi=180, bbox_inches='tight')
plt.close()

# 11. CLIMATE COMPOUND EVENTS
print("Generating 11...")
np.random.seed(123)
n = 3000
u_c, v_c = clayton_copula_sample(n, 2.5)
u_c, v_c = 1 - u_c, 1 - v_c
wind = genextreme.ppf(u_c, -0.1, loc=15, scale=5)
precip = gamma_dist.ppf(v_c, 3, loc=0, scale=8)

fig, axes = plt.subplots(1, 2, figsize=(12, 5))
axes[0].scatter(wind, precip, s=5, alpha=0.3, c=sky, edgecolors='none')
extreme = (wind > np.percentile(wind, 95)) & (precip > np.percentile(precip, 95))
axes[0].scatter(wind[extreme], precip[extreme], s=12, c=red, alpha=0.8, edgecolors='none',
                label=f'Compound extremes ({extreme.sum()})')
axes[0].axvline(np.percentile(wind, 95), color=amber, ls='--', lw=1, alpha=0.5, label='95th percentile')
axes[0].axhline(np.percentile(precip, 95), color=amber, ls='--', lw=1, alpha=0.5)
axes[0].set_xlabel('Wind speed (m/s)'); axes[0].set_ylabel('Daily precipitation (mm)')
axes[0].set_title('Compound wind-precipitation events', color='#e4e4e8', fontsize=12)
axes[0].legend(frameon=False, fontsize=9)

axes[1].bar(['Wind\nalone', 'Precip\nalone', 'Independent\nassumption', 'With\ndependence'],
            [20, 20, 400, 55], color=[blue, violet, '#6b7280', red], alpha=0.7, edgecolor='none')
axes[1].set_ylabel('Return period (years)')
axes[1].set_title('Independence assumption underestimates risk', color='#e4e4e8', fontsize=12)

plt.tight_layout()
plt.savefig(f'{out}/11-climate-compound.png', dpi=180, bbox_inches='tight')
plt.close()

print("All visualizations complete!")
