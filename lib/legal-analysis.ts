export type AnalysisLanguage = "ar" | "en";
export type Finding = {
  id: string;
  category: string;
  priority: "Review";
  title: string;
  evidence: string;
  matchedText: string;
  startOffset: number;
  endOffset: number;
  pageNumber: number | null;
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
  { id: "payment-contingent", priority: "Review", match: /(?:payment|invoice|invoices|fees|amount due)[^.!?\n]{0,100}(?:after|upon|subject to|following)[^.!?\n]{0,70}(?:approval|acceptance|accepts?|accepted|satisfaction|sign[- ]off)|(?:الدفع|السداد|الفاتورة|الفواتير|الأتعاب)[^.!؟\n]{0,100}(?:بعد|عند|رهناً بـ|بموافقة|اعتماد|قبول)|(?:تسدد|يسدد|يدفع|تدفع)[^.!؟\n]{0,100}(?:بعد|عند|رهناً بـ|بموافقة|اعتماد|قبول)/iu, category: { en: "Payment", ar: "المدفوعات" }, title: { en: "Payment is linked to approval or acceptance", ar: "يرتبط السداد بالموافقة أو القبول" }, explanation: { en: "The quoted wording links payment to acceptance. Check that acceptance criteria are objective and that the review and payment periods are clear.", ar: "يربط النص المقتبس السداد بالقبول. تحقّق من وضوح معايير القبول وموضوعيتها ومن تحديد مهلتي المراجعة والسداد." }, question: { en: "Are acceptance criteria objective, and are review and payment deadlines stated?", ar: "هل معايير القبول موضوعية، وهل حُددت مهلتا المراجعة والسداد؟" } },
  { id: "payment-timing", priority: "Review", match: /(?:payment|invoice|invoices|fees|amount due)[^.!?\n]{0,120}(?:within \d+|net \d+|calendar days|business days|days of receipt)|(?:الدفع|السداد|الفاتورة|الفواتير|الأتعاب)[^.!؟\n]{0,120}(?:خلال|في غضون)\s*\d+/iu, category: { en: "Payment", ar: "المدفوعات" }, title: { en: "Payment timing is stated; confirm the trigger", ar: "ورد توقيت للسداد؛ تحقّق من تاريخ بدء المهلة" }, explanation: { en: "A payment period appears in the text. Check which event starts the clock, such as invoice receipt, delivery, or acceptance.", ar: "تظهر مهلة للسداد في النص. تحقّق من الحدث الذي يبدأ احتسابها، مثل استلام الفاتورة أو التسليم أو القبول." }, question: { en: "What exact event starts the payment period?", ar: "ما الحدث المحدد الذي يبدأ منه احتساب مهلة السداد؟" } },
  { id: "scope", priority: "Review", match: /(?:scope of work|deliverables?|statement of work|services to be provided|project requirements)|(?:نطاق العمل|المخرجات|الأعمال المطلوب تنفيذها|الخدمات المقدمة|متطلبات المشروع)/iu, category: { en: "Scope and deliverables", ar: "نطاق العمل والمخرجات" }, title: { en: "Scope or deliverable wording is present", ar: "يتضمن النص أحكاماً لنطاق العمل أو المخرجات" }, explanation: { en: "Check whether the work, format, quantity, dependencies, and out-of-scope requests are described clearly.", ar: "تحقّق من وضوح العمل والصيغة والكمية والاعتماديات والطلبات الخارجة عن النطاق." }, question: { en: "Can both parties identify what counts as complete delivery?", ar: "هل يستطيع الطرفان تحديد ما يعد تسليماً مكتملاً؟" } },
  { id: "deadlines", priority: "Review", match: /(?:delivery date|deadline|time is of the essence|deliver (?:the )?(?:work|services)|completion date)|(?:موعد التسليم|الموعد النهائي|موعد الإنجاز|تسليم الأعمال|مدة التنفيذ)/iu, category: { en: "Deadlines and delivery", ar: "المواعيد والتسليم" }, title: { en: "Deadline or delivery wording is present", ar: "يتضمن النص أحكاماً للمواعيد أو التسليم" }, explanation: { en: "Check the delivery date, dependencies, review time, and how delays or requested changes affect the schedule.", ar: "تحقّق من موعد التسليم والاعتماديات ومدة المراجعة وأثر التأخير أو التغييرات المطلوبة على الجدول." }, question: { en: "Which party dependencies can change the delivery schedule?", ar: "ما الاعتماديات على الأطراف التي قد تغير جدول التسليم؟" } },
  { id: "termination", priority: "Review", match: /(?:terminat(?:e|ion)|cancel(?:lation)?|end (?:(?:this|the) )?(?:agreement|project)|notice of termination)|(?:إنهاء|فسخ|إلغاء|إنهاء الاتفاق|إشعار بالإنهاء)/iu, category: { en: "Termination", ar: "الإنهاء" }, title: { en: "Termination terms are present", ar: "يتضمن النص أحكاماً للإنهاء" }, explanation: { en: "The text addresses ending the relationship. Confirm notice periods, payment for completed or in-progress work, and any post-termination duties.", ar: "يتناول النص إنهاء العلاقة. تحقّق من مهلة الإشعار والمقابل عن الأعمال المنجزة أو الجارية والالتزامات بعد الإنهاء." }, question: { en: "What is owed, and which duties continue, if either party ends the agreement?", ar: "ما المستحقات والالتزامات المستمرة إذا أنهى أي طرف الاتفاق؟" } },
  { id: "ownership", priority: "Review", match: /(?:intellectual property|work product|ownership|assign(?:s|ment)? of rights|all rights|copyright)|(?:الملكية الفكرية|حقوق الملكية|حقوق النشر|ملكية الأعمال|تنتقل ملكية|نقل الحقوق)/iu, category: { en: "Intellectual property", ar: "الملكية الفكرية" }, title: { en: "Ownership or intellectual-property terms are present", ar: "يتضمن النص أحكاماً للملكية الفكرية أو الحقوق" }, explanation: { en: "The text refers to ownership or intellectual property. Check what transfers, when it transfers, and whether pre-existing materials are excluded.", ar: "يشير النص إلى الملكية أو الملكية الفكرية. تحقّق مما ينتقل ومتى، وما إذا كانت المواد السابقة مستثناة." }, question: { en: "Are pre-existing tools and materials clearly excluded, and does transfer depend on payment?", ar: "هل تُستثنى الأدوات والمواد السابقة بوضوح، وهل يرتبط نقل الحقوق بالسداد؟" } },
  { id: "liability", priority: "Review", match: /(?:liability|liable|indemnif(?:y|ication)|hold harmless|consequential damages|limitation of damages)|(?:المسؤولية|مسؤولية|مسؤولاً عن|تعويض|إعفاء من المسؤولية|الأضرار غير المباشرة|حدود المسؤولية)/iu, category: { en: "Liability", ar: "المسؤولية" }, title: { en: "Liability or indemnity language is present", ar: "يتضمن النص أحكاماً للمسؤولية أو التعويض" }, explanation: { en: "This wording may allocate responsibility for losses or claims. Check its scope, exceptions, cap, and whether obligations are mutual.", ar: "قد يوزع هذا النص المسؤولية عن الخسائر أو المطالبات. تحقّق من نطاقه والاستثناءات والحد الأقصى وما إذا كانت الالتزامات متبادلة." }, question: { en: "Is responsibility limited, mutual, and subject to appropriate exceptions?", ar: "هل المسؤولية محدودة ومتبادلة وخاضعة لاستثناءات مناسبة؟" } },
  { id: "confidentiality", priority: "Review", match: /(?:confidential(?:ity)?|non[- ]disclosure|proprietary information)|(?:السرية|معلومات سرية|عدم الإفصاح)/iu, category: { en: "Confidentiality", ar: "السرية" }, title: { en: "Confidentiality terms are present", ar: "يتضمن النص أحكاماً للسرية" }, explanation: { en: "Check what information is protected, permitted use and disclosure, exclusions, duration, and return or deletion duties.", ar: "تحقّق من المعلومات المحمية والاستخدام والإفصاح المسموحين والاستثناءات والمدة والتزامات الإعادة أو الحذف." }, question: { en: "Are the protected information, exceptions, duration, and permitted disclosures clear?", ar: "هل المعلومات المحمية والاستثناءات والمدة وحالات الإفصاح المسموح بها واضحة؟" } },
  { id: "data-protection", priority: "Review", match: /(?:personal data|data protection|process(?:ing)? data|data breach|privacy notice)|(?:البيانات الشخصية|حماية البيانات|معالجة البيانات|خرق البيانات|إشعار الخصوصية)/iu, category: { en: "Personal data", ar: "البيانات الشخصية" }, title: { en: "Personal-data handling terms are present", ar: "يتضمن النص أحكاماً للتعامل مع البيانات الشخصية" }, explanation: { en: "Check the data involved, permitted purposes, security duties, incident notice, retention, and deletion. This screen does not assess legal compliance.", ar: "تحقّق من نوع البيانات والأغراض المسموحة والتزامات الأمان والإبلاغ عن الحوادث والاحتفاظ والحذف. هذا الفحص لا يقيّم الامتثال القانوني." }, question: { en: "Who handles the data, for which purposes, and what happens after the work ends?", ar: "من يتعامل مع البيانات ولأي أغراض، وما الذي يحدث بعد انتهاء العمل؟" } },
  { id: "renewal", priority: "Review", match: /(?:auto(?:matic)?(?:ally)? renew|renewal term|evergreen|renews for successive)|(?:يتجدد[^.!؟\n]{0,35}تلقائياً|التجديد التلقائي|مدة التجديد)/iu, category: { en: "Renewal", ar: "التجديد" }, title: { en: "Renewal wording is present", ar: "يتضمن النص أحكاماً للتجديد" }, explanation: { en: "Check the renewal period, opt-out deadline, and notice method; this text match does not determine whether renewal is automatic.", ar: "تحقّق من مدة التجديد والمهلة اللازمة لرفضه وطريقة الإشعار؛ هذا التطابق لا يحدد ما إذا كان التجديد تلقائياً." }, question: { en: "Can you track and meet any renewal or cancellation notice deadline?", ar: "هل يمكنك متابعة أي مهلة لإشعار التجديد أو الإلغاء والالتزام بها؟" } },
  { id: "exclusivity", priority: "Review", match: /(?:exclusive(?:ly)?|exclusivity|non[- ]compete|non[- ]competition|not engage with competitors)|(?:الحصرية|حصري|عدم المنافسة|منافسة العميل)/iu, category: { en: "Exclusivity and competition", ar: "الحصرية والمنافسة" }, title: { en: "Exclusivity or competition wording is present", ar: "يتضمن النص أحكاماً للحصرية أو المنافسة" }, explanation: { en: "Check who is restricted, which activities and territories are covered, and how long the restriction lasts.", ar: "تحقّق ممن تشملهم القيود والأنشطة والمناطق المشمولة ومدة القيد." }, question: { en: "Does this restriction affect your other clients or work, and is its scope precisely defined?", ar: "هل يؤثر هذا القيد في عملك أو عملائك الآخرين، وهل نطاقه محدد بدقة؟" } },
  { id: "expenses", priority: "Review", match: /(?:expenses|reimburse(?:ment)?|travel costs|out[- ]of[- ]pocket|disbursements)|(?:المصروفات|مصروفات|النفقات|استرداد التكاليف|تكاليف السفر|مصاريف)/iu, category: { en: "Expenses", ar: "المصروفات" }, title: { en: "Expense or reimbursement wording is present", ar: "يتضمن النص أحكاماً للمصروفات أو استردادها" }, explanation: { en: "Check which costs are covered, whether prior approval is needed, and how and when reimbursement is made.", ar: "تحقّق من التكاليف المشمولة والحاجة إلى موافقة مسبقة وكيفية وموعد استردادها." }, question: { en: "Which expenses need approval, and what records or deadlines apply?", ar: "ما المصروفات التي تحتاج إلى موافقة، وما المستندات أو المهل المطلوبة؟" } },
  { id: "warranties", priority: "Review", match: /(?:warrant(?:s|y|ies)|represent(?:ation|s) and warrant|guarantee|as[- ]is)|(?:الضمانات|يضمن|ضمان|إقرارات وتعهدات)/iu, category: { en: "Warranties and representations", ar: "الضمانات والإقرارات" }, title: { en: "Warranty or representation wording is present", ar: "يتضمن النص أحكاماً للضمان أو الإقرارات" }, explanation: { en: "Check what is promised, how long the promise lasts, available remedies, and any exclusions.", ar: "تحقّق مما تم التعهد به ومدة التعهد ووسائل المعالجة والاستثناءات." }, question: { en: "Are the promises and remedies limited to what you can verify and control?", ar: "هل تقتصر التعهدات ووسائل المعالجة على ما يمكنك التحقق منه والتحكم فيه؟" } },
  { id: "force-majeure", priority: "Review", match: /(?:force majeure|act of god|beyond (?:a party's|either party's) control|unforeseen event)|(?:القوة القاهرة|ظروف خارجة عن الإرادة|أحداث غير متوقعة)/iu, category: { en: "Unexpected events", ar: "الظروف الطارئة" }, title: { en: "Unexpected-event wording is present", ar: "يتضمن النص أحكاماً للظروف الطارئة" }, explanation: { en: "Check which events are covered, required notice and mitigation, and whether either party may end the agreement after a prolonged event.", ar: "تحقّق من الأحداث المشمولة والإشعار وتخفيف الآثار وما إذا جاز لأي طرف إنهاء الاتفاق عند استمرار الحدث." }, question: { en: "Which duties are paused, and what happens if the event continues?", ar: "ما الالتزامات التي تتوقف، وماذا يحدث إذا استمر الحدث؟" } },
  { id: "subcontracting", priority: "Review", match: /(?:subcontract(?:or|ing)?|third[- ]party provider|delegate (?:the )?work)|(?:التعاقد من الباطن|مقاول من الباطن|مقدم خدمة من طرف ثالث|تفويض العمل)/iu, category: { en: "Subcontracting", ar: "التعاقد من الباطن" }, title: { en: "Subcontracting or delegation wording is present", ar: "يتضمن النص أحكاماً للتعاقد من الباطن أو التفويض" }, explanation: { en: "Check whether consent is required, who remains responsible, and whether confidentiality and data duties flow down to providers.", ar: "تحقّق من اشتراط الموافقة ومن يظل مسؤولاً وانتقال التزامات السرية والبيانات إلى مقدمي الخدمة." }, question: { en: "Can work be delegated, and who remains accountable for it?", ar: "هل يجوز تفويض العمل، ومن يظل مسؤولاً عنه؟" } },
  { id: "notices", priority: "Review", match: /(?:written notice|notice must be sent|notices? (?:to|at|by)|deemed received)|(?:الإخطار الكتابي|إخطار كتابي|إشعار كتابي|ترسل الإشعارات|يعتبر الإخطار مستلماً)/iu, category: { en: "Notices", ar: "الإخطارات" }, title: { en: "Notice requirements are present", ar: "يتضمن النص متطلبات للإخطارات" }, explanation: { en: "Check permitted delivery methods, addresses, when notice takes effect, and whether different notice periods apply.", ar: "تحقّق من وسائل الإرسال والعناوين ووقت سريان الإخطار وما إذا كانت المهل تختلف بحسب نوعه." }, question: { en: "How must notice be sent, and when is it treated as received?", ar: "كيف يجب إرسال الإخطار، ومتى يعد مستلماً؟" } },
  { id: "amendments", priority: "Review", match: /(?:amend(?:ment|ed)?|modify this agreement|changes? (?:to|must be) in writing)|(?:تعديل[^.!؟\n]{0,30}الاتفاق|تعديلات مكتوبة|لا يعدل إلا كتابة|تغيير أحكام الاتفاق)/iu, category: { en: "Amendments", ar: "التعديلات" }, title: { en: "Amendment requirements are present", ar: "يتضمن النص متطلبات لتعديل الاتفاق" }, explanation: { en: "Check who may approve changes and whether change requests affect fees, timing, or scope.", ar: "تحقّق ممن يملك اعتماد التغييرات وما إذا كانت طلبات التغيير تؤثر في الأتعاب أو المواعيد أو نطاق العمل." }, question: { en: "How are scope changes approved and priced?", ar: "كيف تعتمد تغييرات نطاق العمل وتحدد تكلفتها؟" } },
  { id: "late-payment", priority: "Review", match: /(?:late payment|overdue|interest at|late fee|penalty for late)|(?:التأخر في السداد|مبلغ التأخير|فوائد التأخير|غرامة تأخير|متأخرات السداد|المبالغ المتأخرة بالسداد)/iu, category: { en: "Late payment", ar: "التأخر في السداد" }, title: { en: "Late-payment consequences are present", ar: "يتضمن النص آثاراً للتأخر في السداد" }, explanation: { en: "Check when a payment becomes overdue, how any charge is calculated, and whether notice or a cure period is required.", ar: "تحقّق من موعد اعتبار السداد متأخراً وكيفية حساب أي مبلغ إضافي واشتراط الإشعار أو مهلة المعالجة." }, question: { en: "Is the due date and any late charge calculation clearly stated?", ar: "هل تاريخ الاستحقاق وطريقة حساب أي مبلغ للتأخير محددان بوضوح؟" } },
  { id: "disputes", priority: "Review", match: /(?:governing law|governed by the laws|jurisdiction|venue|arbitration|dispute resolution|courts of)|(?:القانون الواجب التطبيق|قانون[^.!؟\n]{0,20}(?:مصر|الإمارات)|الاختصاص القضائي|التحكيم|تسوية النزاعات|المحاكم المختصة)/iu, category: { en: "Disputes and governing law", ar: "النزاعات والقانون الواجب التطبيق" }, title: { en: "Dispute or governing-law terms are present", ar: "يتضمن النص أحكاماً للنزاعات أو القانون الواجب التطبيق" }, explanation: { en: "The text appears to identify a process, forum, or law for disputes. Confirm that it is clear and practical for the parties.", ar: "يبدو أن النص يحدد إجراءً أو جهة أو قانوناً للنزاعات. تحقّق من وضوحه وملاءمته للأطراف." }, question: { en: "Which law and forum apply, and are they practical for you?", ar: "ما القانون والجهة المختصة، وهل هما مناسبان لك؟" } },
];

function evidenceFor(text: string, index: number): { text: string; startOffset: number; endOffset: number } {
  const start = Math.max(text.lastIndexOf("\n", index), text.lastIndexOf(".", index), text.lastIndexOf("؟", index), text.lastIndexOf("!", index)) + 1;
  const ends = ["\n", ".", "؟", "!"].map((separator) => {
    const position = text.indexOf(separator, index);
    return position < 0 ? text.length : position + 1;
  });
  const end = Math.min(...ends);
  const raw = text.slice(start, end);
  const leadingWhitespace = raw.length - raw.trimStart().length;
  const evidenceStart = start + leadingWhitespace;
  const evidence = raw.trim().slice(0, 700);
  return { text: evidence, startOffset: evidenceStart, endOffset: evidenceStart + evidence.length };
}

function pageNumberFor(text: string, index: number): number | null {
  const markerStart = text.lastIndexOf("[Page ", index);
  if (markerStart < 0) return null;
  const marker = /^\[Page\s+(\d+)\]/u.exec(text.slice(markerStart, index));
  return marker ? Number(marker[1]) : null;
}

export function analyzeContract(text: string, language: AnalysisLanguage): Finding[] {
  const findings = rules.flatMap((rule) => {
    const match = rule.match.exec(text);
    if (!match || !match[0]) return [];
    const evidence = evidenceFor(text, match.index);
    const pageNumber = pageNumberFor(text, match.index);
    if (rule.id === "disputes" && /not been reviewed for any jurisdiction|لم تراجع وفق قوانين أي اختصاص/iu.test(evidence.text)) return [];
    return [{
      id: rule.id,
      category: rule.category[language],
      priority: rule.priority,
      title: rule.title[language],
      evidence: evidence.text,
      matchedText: match[0],
      startOffset: evidence.startOffset,
      endOffset: evidence.endOffset,
      pageNumber,
      explanation: rule.explanation[language],
      question: rule.question[language],
    }];
  });
  if (findings.some((finding) => finding.id === "payment-contingent")) {
    return findings.filter((finding) => finding.id !== "payment-timing");
  }
  return findings;
}


