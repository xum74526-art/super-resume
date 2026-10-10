import type { Block, Locale } from './layout.js';
import { splitSections } from './templates.js';

/** Presentation-only fields. The interchange document is never changed. */
export function foldedLayout(blocks: Block[], locale: Locale) {
  const { header, sections } = splitSections(blocks.filter(block => !block.basicField));
  const fields = [
    ...header.filter(b => b.kind === 'title').map(b => ({ key: 'name', value: b.text })),
    ...header.filter(b => b.kind === 'contact').flatMap(b => b.fields ?? [{ key: 'profile', value: b.text }]),
    ...blocks.filter(b => b.basicField).flatMap(b => b.fields ?? []),
  ];
  const labels: Record<string, string> = locale === 'en'
    ? { name: 'Name', gender: 'Gender', ethnicity: 'Ethnicity', age: 'Age', phone: 'Phone', email: 'Email', url: 'Website', location: 'Location', profile: 'Profile', expectedSalary: 'Expected salary', desiredLocation: 'Preferred location' }
    : { name: '姓名', gender: '性别', ethnicity: '民族', age: '年龄', phone: '电话', email: '邮箱', url: '网站', location: '所在地', profile: '主页', expectedSalary: '期望薪资', desiredLocation: '意向城市' };
  const order = ['name', 'gender', 'ethnicity', 'age', 'phone', 'email', 'location', 'url', 'profile'];
  const intent = fields.filter(f => ['expectedSalary', 'desiredLocation'].includes(f.key));
  const identity = fields.filter(f => !intent.includes(f)).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  // Keep the reference's compact single-column reading rhythm. Joining adjacent
  // lines changes presentation only: every supplied value remains in the output.
  const compact = sections.map(section => {
    const content: Block[] = [];
    for(let i=0;i<section.blocks.length;i++){
      const block=section.blocks[i]!, next=section.blocks[i+1];
      if(block.kind==='entry'&&next?.kind==='body'&&section.id==='skills'){
        content.push({kind:'body',text:`${block.text}：${next.text}`}); i++;
      }else if(block.kind==='entry'&&next?.kind==='detail'&&/^\d{4}(?:-\d{2})?/u.test(next.text)&&['education','work','projects'].includes(section.id)){
        content.push({...block,text:`${next.text}    ${block.text}`}); i++;
      }else content.push(block);
    }
    return {...section,blocks:content};
  });
  return {
    sections: compact,
    identity: identity.map(f => `${labels[f.key] ?? f.key}：${f.value}`),
    intent: [
      ...header.filter(b => b.kind === 'subtitle').map(b => b.text),
      ...intent.map(f => `${labels[f.key]}：${f.value}`),
    ],
    // Preserve arbitrary extension facts that precede the first section.
    extra: header.filter(b => !['title', 'subtitle', 'contact'].includes(b.kind)),
  };
}
