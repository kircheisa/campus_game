# -*- coding: utf-8 -*-
# 修复：写日记时，摘抄本里既有名句(q1..)又有书中句子(bookId#idx)
import io
p = 'js/game.js'
s = io.open(p, encoding='utf-8').read()

old = """      const recent = ex.slice(-8);
      const qopts = recent.map(id => ADV.Collect.info('quotes', id).name).concat(['（今天不引用）']);
      const qi = await choose(qopts, { caption: { name: '📔 写日记', text: '想在本子上用上一句读过的话吗？' } });
      if (qi >= 0 && qi < recent.length) {
        const q = ADV.Collect.info('quotes', recent[qi]);
        quote = q.name;
        from = q.desc;
      }"""
new = """      const recent = ex.slice(-8);
      // 摘抄本里既有“名句”(q1..)，也有“书中句子”(bookId#句号)：统一取文案
      const pick = key => {
        const e = f.excerpts[key] || {};
        const q = ADV.Collect.info('quotes', key);
        return e.text ? { quote: e.text, from: '—— ' + (e.from || '') }
                      : { quote: (q && q.name) || '（？）', from: (q && q.desc) || '' };
      };
      const qopts = recent.map(key => pick(key).quote).concat(['（今天不引用）']);
      const qi = await choose(qopts, { caption: { name: '📔 写日记', text: '想在本子上用上一句读过的话吗？' } });
      if (qi >= 0 && qi < recent.length) {
        const sel = pick(recent[qi]);
        quote = sel.quote;
        from = sel.from;
      }"""
assert old in s, 'NOT FOUND'
io.open(p, 'w', encoding='utf-8', newline='').write(s.replace(old, new, 1))
print('diaryWrite patched')
