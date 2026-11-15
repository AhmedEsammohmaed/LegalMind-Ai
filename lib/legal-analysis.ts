export type AnalysisLanguage = "ar" | "en";
export type Finding = {
  id: string;
  category: string;
  priority: "High" | "Medium" | "Review";
  title: string;
  evidence: string;
  explanation: string;
  question: string;
};

type Rule = {
  id: string;
  priority: Finding["priority"];
  match: RegExp;
  category: Record<AnalysisLanguage, string>;
  title: Record<AnalysisLanguage, string>;
  explanation: Record<AnalysisLanguage, string>;
  question: Record<AnalysisLanguage, string>;
};

const rules: Rule[] = [
  { id: "payment-contingent", priority: "High", match: /(?:payment|invoice|fees|amount due)[^.!?\n]{0,100}(?:after|upon|subject to|following)[^.!?\n]{0,70}(?:approval|acceptance|satisfaction|sign[- ]off)|(?:الدفع|السداد|الفاتورة|الأتعاب)[^.!؟\n]{0,100}(?:بعد|عند|رهناً بـ|بموافقة|اعتماد)/iu, category: { en: "Payment", ar: "المدفوعات" }, title: { en: "Payment may depend on approval", ar: "قد يكون السداد مرتبطاً بالموافقة" }, explanation: { en: "The text appears to make payment conditional on approval or acceptance. It may not state a clear review deadline or what happens if no response is given.", ar: "يبدو أن النص يربط السداد بالموافقة أو القبول. قد لا يحدد مهلة للمراجعة أو ما يحدث عند عدم الرد." }, question: { en: "Is there a fixed review period and a clear payment due date?", ar: "هل توجد مهلة محددة للمراجعة وتاريخ واضح لاستحقاق السداد؟" } },
  { id: "payment-timing", priority: "Medium", match: /(?:payment|invoice|fees|amount due)[^.!?\n]{0,120}(?:within \d+|net \d+|calendar days|business days|days of receipt)|(?:الدفع|السداد|الفاتورة|الأتعاب)[^.!؟\n]{0,120}(?:خلال|في غضون)\s*\d+/iu, category: { en: "Payment", ar: "المدفوعات" }, title: { en: "Payment timing is stated; confirm the trigger", ar: "ورد توقيت للسداد؛ تحقّق من تاريخ بدء المهلة" }, explanation: { en: "A payment period appears in the text. Check which event starts the clock, such as invoice receipt, delivery, or acceptance.", ar: "تظهر مهلة للسداد في النص. تحقّق من الحدث الذي يبدأ احتسابها، مثل استلام الفاتورة أو التسليم أو القبول." }, question: { en: "What exact event starts the payment period?", ar: "ما الحدث المحدد الذي يبدأ منه احتساب مهلة السداد؟" } },
  { id: "termination", priority: "Medium", match: /(?:terminat(?:e|ion)|cancel(?:lation)?|end this agreement|notice of termination)|(?:إنهاء|فسخ|إلغاء|إنهاء الاتفاق|إشعار بالإنهاء)/iu, category: { en: "Termination", ar: "الإنهاء" }, title: { en: "Termination terms are present", ar: "يتضمن النص أحكاماً للإنهاء" }, explanation: { en: "The text addresses ending the relationship. Confirm notice periods, payment for completed or in-progress work, and any post-termination duties.", ar: "يتناول النص إنهاء العلاقة. تحقّق من مهلة الإشعار والمقابل عن الأعمال المنجزة أو الجارية والالتزامات بعد الإنهاء." }, question: { en: "What is owed, and which duties continue, if either party ends the agreement?", ar: "ما المستحقات والالتزامات المستمرة إذا أنهى أي طرف الاتفاق؟" } },
  { id: "ownership", priority: "Medium", match: /(?:intellectual property|work product|ownership|assign(?:s|ment)? of rights|all rights|copyright)|(?:الملكية الفكرية|حقوق الملكية|حقوق النشر|ملكية الأعمال|نقل الحقوق)/iu, category: { en: "Intellectual property", ar: "الملكية الفكرية" }, title: { en: "Ownership or intellectual-property terms are present", ar: "يتضمن النص أحكاماً للملكية الفكرية أو الحقوق" }, explanation: { en: "The text refers to ownership or intellectual property. Check what transfers, when it transfers, and whether pre-existing materials are excluded.", ar: "يشير النص إلى الملكية أو الملكية الفكرية. تحقّق مما ينتقل ومتى، وما إذا كانت المواد السابقة مستثناة." }, question: { en: "Are pre-existing tools and materials clearly excluded, and does transfer depend on payment?", ar: "هل تُستثنى الأدوات والمواد السابقة بوضوح، وهل يرتبط نقل الحقوق بالسداد؟" } },
  { id: "liability", priority: "High", match: /(?:liability|liable|indemnif(?:y|ication)|hold harmless|consequential damages|limitation of damages)|(?:المسؤولية|مسؤولاً عن|تعويض|إعفاء من المسؤولية|الأضرار غير المباشرة|حدود المسؤولية)/iu, category: { en: "Liability", ar: "المسؤولية" }, title: { en: "Liability or indemnity language is present", ar: "يتضمن النص أحكاماً للمسؤولية أو التعويض" }, explanation: { en: "This wording may allocate responsibility for losses or claims. Check its scope, exceptions, cap, and whether obligations are mutual.", ar: "قد يوزع هذا النص المسؤولية عن الخسائر أو المطالبات. تحقّق من نطاقه والاستثناءات والحد الأقصى وما إذا كانت الالتزامات متبادلة." }, question: { en: "Is responsibility limited, mutual, and subject to appropriate exceptions?", ar: "هل المسؤولية محدودة ومتبادلة وخاضعة لاستثناءات مناسبة؟" } },
  { id: "renewal", priority: "Review", match: /(?:auto(?:matic)?(?:ally)? renew|renewal term|evergreen|renews for successive)|(?:يتجدد تلقائياً|التجديد التلقائي|مدة التجديد)/iu, category: { en: "Renewal", ar: "التجديد" }, title: { en: "Automatic-renewal wording is present", ar: "يتضمن النص صياغة للتجديد التلقائي" }, explanation: { en: "Check the renewal period, the deadline to opt out, and the method for giving notice.", ar: "تحقّق من مدة التجديد والمهلة اللازمة لرفضه وطريقة إرسال الإشعار." }, question: { en: "Can you track and meet the cancellation notice deadline?", ar: "هل يمكنك متابعة مهلة الإشعار بالإلغاء والالتزام بها؟" } },
  { id: "disputes", priority: "Review", match: /(?:governing law|jurisdiction|venue|arbitration|dispute resolution|courts of)|(?:القانون الواجب التطبيق|الاختصاص القضائي|التحكيم|تسوية النزاعات|المحاكم المختصة)/iu, category: { en: "Disputes and governing law", ar: "النزاعات والقانون الواجب التطبيق" }, title: { en: "Dispute or governing-law terms are present", ar: "يتضمن النص أحكاماً للنزاعات أو القانون الواجب التطبيق" }, explanation: { en: "The text appears to identify a process, forum, or law for disputes. Confirm that it is clear and practical for the parties.", ar: "يبدو أن النص يحدد إجراءً أو جهة أو قانوناً للنزاعات. تحقّق من وضوحه وملاءمته للأطراف." }, question: { en: "Which law and forum apply, and are they practical for you?", ar: "ما القانون والجهة المختصة، وهل هما مناسبان لك؟" } },
];

function evidenceFor(text: string, index: number) {
  const start = Math.max(text.lastIndexOf("\n", index), text.lastIndexOf(".", index), text.lastIndexOf("؟", index), text.lastIndexOf("!", index)) + 1;
  const ends = ["\n", ".", "؟", "!"].map((separator) => {
    const position = text.indexOf(separator, index);
    return position < 0 ? text.length : position + 1;
  });
  const end = Math.min(...ends);
  return text.slice(start, end).trim().slice(0, 700);
}

export function analyzeContract(text: string, language: AnalysisLanguage): Finding[] {
  return rules.flatMap((rule) => {
    const match = rule.match.exec(text);
    if (!match || !match[0]) return [];
    return [{
      id: rule.id,
      category: rule.category[language],
      priority: rule.priority,
      title: rule.title[language],
      evidence: evidenceFor(text, match.index),
      explanation: rule.explanation[language],
      question: rule.question[language],
    }];
  });
}
