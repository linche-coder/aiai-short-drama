import fs from 'node:fs/promises';
import postcss from 'postcss';
for(const file of ['src/styles.css','src/styles/refinement.css','src/styles/responsive.css','src/styles/motion.css']) {
  const root=postcss.parse(await fs.readFile(file,'utf8'));
  root.walkRules(rule=>{
    if(rule.parent.type==='atrule'&&/keyframes$/.test(rule.parent.name))return;
    const selectors=rule.selectors.filter(s=>!/(poster-info|side-cover-button|card-hover|data-preview|drama-modal|modal-poster|modal-copy|flying-cover)/.test(s));
    if(!selectors.length)rule.remove();else rule.selectors=selectors;
    if(rule.selector==='.hero-poster')rule.walkDecls('transition',d=>d.remove());
  });
  root.walkAtRules(rule=>{if(rule.nodes&&!rule.nodes.length)rule.remove();});
  await fs.writeFile(file,root.toString());
}
