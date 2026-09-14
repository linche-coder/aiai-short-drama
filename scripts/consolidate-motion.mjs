import fs from 'node:fs/promises';
import postcss from 'postcss';
const owned = /^\.(hero(?:[\s.:[-]|$)|carousel-|ambient-layer|side-cover-button|featured-badge|slide-number|autoplay-button|poster-(?:info|edge)|intro(?:[-. :]|$)|brand-(?:icon|hearts|dot|wordmark|sheen|light)|modal(?:[-.: ]|$)|drama-modal|notice-modal|flying-cover)/;
for (const file of ['src/styles.css', 'src/styles/responsive.css', 'src/styles/refinement.css']) {
  const root = postcss.parse(await fs.readFile(file, 'utf8'));
  root.walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    const selectors = rule.selectors.filter(s => !owned.test(s) && !/^\.is-entering \.(hero-inner|drama-card)/.test(s));
    if (!selectors.length) rule.remove(); else rule.selectors = selectors;
  });
  root.walkAtRules(rule => { if (/keyframes$/.test(rule.name) && /^(logo-in|logo-glow|hero-in|card-in|curtain-out|modal-enter|copy-in)$/.test(rule.params)) rule.remove(); });
  root.walkAtRules(rule => { if (rule.nodes && !rule.nodes.length) rule.remove(); });
  await fs.writeFile(file, root.toString());
}
console.log('Removed superseded Banner, Intro and Modal rules from all three legacy sheets.');
