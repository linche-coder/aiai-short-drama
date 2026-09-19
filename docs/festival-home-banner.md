# 首页横幅重设计

## 200px 安全构图修订

使用内置 imagegen 重新生成窄横幅内容，素材保存为 `public/assets/festival/home-festival-panorama-200.png`。主体集中在横向安全区域，网页按原始比例缩放、限制最大宽度，移除 cover 放大裁切；空白上下区域渐隐，月亮与光环完整显示。桌面高度 200px，手机 180px。

本次提示词：

Redesign this Mid-Autumn festival background for a shallow website banner. CRITICAL COMPOSITION SPEC: render a 3:1 wide canvas but ALL decorative subjects must fit inside the central horizontal band from y=36% to y=64% (the central 28% of height), because the web design uses a 10:1 visible band. Top 35% and bottom 35% should be plain dark burgundy-black (#120c14), essentially empty overscan, NOT large decorations. In that narrow center strip: a complete small luminous gold moon centered at x=65%, y=50%, diameter exactly 22% of canvas HEIGHT, with delicate pink gold orbit entirely inside y=36%-64%. Complete small red lantern at x=94%, y=48%, total height 20% of canvas height. Delicate small osmanthus sprays at x=5% and x=96%, confined within the band. A fine sweeping burgundy silk ribbon and golden dust trail along y=61%, flowing horizontally across entire canvas, contained in the band. Left x=15%-40% stays clean dark for separate title art overlay. Right x=80%-90% clean dark for button. Everything outside central band must be dark subtle gradient, no objects. Match reference rich gold, red silk, cinematic black-burgundy palette and 3D luxury craft. No text, no border, no buttons. This is a thin panoramic ornament with empty vertical padding, NOT a large central moon poster. Moon must be SMALL and fully visible, never more than 22% of full canvas height.

沿用活动页金色艺术字、月景、桂花、酒红绸缎与金红切角按钮。仅保留原艺术字和领取按钮，无新增介绍文案。

使用内置 imagegen，以活动页背景为风格参考生成全景背景。最终素材：`public/assets/festival/home-festival-panorama.png`。

## 生成提示词

Generate a NEW ultra-wide panoramic website campaign banner BACKGROUND, aspect ratio 6:1, ideally 2400x400. Use the reference only for exact visual style: cinematic Chinese Mid-Autumn festival, deep burgundy silk, warm gold luminous moon, gold osmanthus flowers, delicate pink-gold orbiting particles, dark luxurious night. Recompose for a VERY SHORT wide banner, not a tall scene. Moon fully visible at 64% horizontal position, diameter only 72% of total image height, centered vertically. Small gold osmanthus sprays frame upper left and far right corners, a restrained red lantern at far right edge, burgundy flowing silk runs continuously along the bottom across the ENTIRE panorama, subtle fine golden stardust sweeping along silk. Keep left 15%-40% dark uncluttered for existing title art overlay; keep right 80%-92% dark burgundy and uncluttered for existing button overlay. The whole image is ONE coherent continuous art-directed composition, no panel divisions, no black empty strip, no repeated moon. Match reference's polished rich golden light and tactile materials. NO TEXT, NO LETTERS, NO LOGOS, NO BUTTONS, no frames. Opaque full bleed background. Wide landscape 6:1 output.
