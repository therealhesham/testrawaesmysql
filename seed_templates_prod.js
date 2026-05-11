const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const templates = [
  {
    title: 'إقرار استلام مستحقات (مخالصة نهائية)',
    type: 'settlement',
    dynamicFields: ["worker_name","nationality","id_number","employer_name","period_from","period_to","date"],
    content: `<div style="font-family: 'Amiri', serif; padding: 20px; color: #000; direction: ltr;">
  <h2 style="text-align: center; text-decoration: underline; margin-bottom: 40px; font-size: 24px;">
    Final Settlement Receipt<br/>
    إقرار استلام مستحقات (مخالصة نهائية)
  </h2>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="text-align: left; width: 30%; font-weight: bold;">I, the undersigned:</td>
      <td style="width: 40%;"></td>
      <td style="text-align: right; width: 30%; font-weight: bold; direction: rtl;">أنا الموقعة أدناه:</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="text-align: left; width: 15%;">Name:</td>
      <td style="border-bottom: 1px solid #000; width: 70%; text-align: center; font-weight: bold;">{worker_name}</td>
      <td style="text-align: right; width: 15%; direction: rtl;">الاسم:</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="text-align: left; width: 15%;">Nationality:</td>
      <td style="border-bottom: 1px solid #000; width: 70%; text-align: center; font-weight: bold;">{nationality}</td>
      <td style="text-align: right; width: 15%; direction: rtl;">الجنسية:</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
    <tr>
      <td style="text-align: left; width: 20%;">Iqama / ID No.:</td>
      <td style="border-bottom: 1px solid #000; width: 60%; text-align: center; font-weight: bold;">{id_number}</td>
      <td style="text-align: right; width: 20%; direction: rtl;">رقم الإقامة / الهوية:</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
    <tr>
      <td style="text-align: left; width: 45%; font-weight: bold; line-height: 1.4;">I hereby acknowledge that I have received all my financial dues from my employer:</td>
      <td style="width: 10%;"></td>
      <td style="text-align: right; width: 45%; font-weight: bold; direction: rtl; line-height: 1.4;">أقر بأنني استلمت كافة مستحقاتي المالية من صاحب العمل:</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="text-align: left; width: 20%;">Employer Name:</td>
      <td style="border-bottom: 1px solid #000; width: 60%; text-align: center; font-weight: bold;">{employer_name}</td>
      <td style="text-align: right; width: 20%; direction: rtl;">اسم صاحب العمل:</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
    <tr>
      <td style="text-align: left; width: 25%;">For the period from:</td>
      <td style="border-bottom: 1px solid #000; width: 15%; text-align: center; font-weight: bold;">{period_from}</td>
      <td style="text-align: center; width: 5%;">to:</td>
      <td style="border-bottom: 1px solid #000; width: 15%; text-align: center; font-weight: bold;">{period_to}</td>
      <td style="text-align: right; width: 40%; direction: rtl;">وذلك عن فترة عملي من تاريخ {period_from} إلى تاريخ {period_to}</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
    <tr>
      <td style="text-align: left; width: 50%; font-weight: bold;">This includes the following dues:</td>
      <td style="text-align: right; width: 50%; font-weight: bold; direction: rtl;">وتشمل هذه المستحقات:</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px;">
    <tr>
      <td style="text-align: left; width: 50%;">- Salaries</td>
      <td style="text-align: right; width: 50%; direction: rtl;">- الرواتب</td>
    </tr>
  </table>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px;">
    <tr>
      <td style="text-align: left; width: 50%;">- Leave compensation (if any)</td>
      <td style="text-align: right; width: 50%; direction: rtl;">- بدل الإجازات (إن وجد)</td>
    </tr>
  </table>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px;">
    <tr>
      <td style="text-align: left; width: 50%;">- End of service benefits (if any)</td>
      <td style="text-align: right; width: 50%; direction: rtl;">- مكافأة نهاية الخدمة (إن وجدت)</td>
    </tr>
  </table>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
    <tr>
      <td style="text-align: left; width: 50%;">- Any other dues</td>
      <td style="text-align: right; width: 50%; direction: rtl;">- أي مستحقات أخرى</td>
    </tr>
  </table>

  <div style="text-align: right; direction: rtl; margin-bottom: 10px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; font-size: 16px;">
    أقّر تماماً بأنه ليس لدي أي مطالبات مالية أو قانونية أخرى ضد صاحب العمل أو مكتب روائس بعد توقيع هذه الوثيقة.
  </div>
  <div style="text-align: left; direction: ltr; margin-bottom: 50px; font-weight: bold; text-decoration: underline; line-height: 1.4; font-size: 15px;">
    I fully acknowledge that I have no other financial or legal claims against my employer or Rawaes office after signing this document.
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="text-align: left; width: 10%;">Name:</td>
      <td style="border-bottom: 1px solid #000; width: 75%; text-align: center; font-weight: bold;">{worker_name}</td>
      <td style="text-align: right; width: 15%; direction: rtl;">الاسم:</td>
    </tr>
  </table>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="text-align: left; width: 10%;">Signature:</td>
      <td style="border-bottom: 1px solid #000; width: 75%;"></td>
      <td style="text-align: right; width: 15%; direction: rtl;">التوقيع:</td>
    </tr>
  </table>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="text-align: left; width: 10%;">Date:</td>
      <td style="border-bottom: 1px solid #000; width: 75%; text-align: center; font-weight: bold;">{date}</td>
      <td style="text-align: right; width: 15%; direction: rtl;">التاريخ:</td>
    </tr>
  </table>
</div>`
  },
  {
    title: 'إقرار موافقة نقل خدمات',
    type: 'consent',
    dynamicFields: ["worker_name","id_number","nationality","passport_number","date"],
    content: `<div style="font-family: 'Amiri', serif; padding: 20px; color: #000; direction: ltr;">
  <h2 style="text-align: center; text-decoration: underline; margin-bottom: 20px; font-size: 22px;">
    إقرار موافقة نقل خدمات<br/>
    Consent Declaration for Transfer of Sponsorship
  </h2>
  
  <p style="text-align: center; margin-bottom: 30px;">التاريخ / Date: {date}</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="text-align: left; width: 25%;">I, the worker:</td>
      <td style="border-bottom: 1px solid #000; width: 50%; text-align: center; font-weight: bold;">{worker_name}</td>
      <td style="text-align: right; width: 25%; direction: rtl;">أقر أنا العاملة:</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="text-align: left; width: 25%;">Holder of ID No.:</td>
      <td style="border-bottom: 1px solid #000; width: 50%; text-align: center; font-weight: bold;">{id_number}</td>
      <td style="text-align: right; width: 25%; direction: rtl;">هوية رقم:</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="text-align: left; width: 25%;">Nationality:</td>
      <td style="border-bottom: 1px solid #000; width: 50%; text-align: center; font-weight: bold;">{nationality}</td>
      <td style="text-align: right; width: 25%; direction: rtl;">الجنسـية:</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
    <tr>
      <td style="text-align: left; width: 25%;">Passport No.:</td>
      <td style="border-bottom: 1px solid #000; width: 50%; text-align: center; font-weight: bold;">{passport_number}</td>
      <td style="text-align: right; width: 25%; direction: rtl;">جواز رقم:</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
    <tr>
      <td style="text-align: left; width: 48%; direction: ltr; font-size: 14px; line-height: 1.6;">
        Hereby declare my full consent and willingness to transfer my sponsorship from my current sponsor to a new sponsor. I have authorized Rawaes Office to complete all necessary procedures on my behalf, without any pressure or coercion, and with my full free will. I also acknowledge that I am fully aware of all procedures and consequences resulting from this decision, and I bear full responsibility for it.
      </td>
      <td style="width: 4%;"></td>
      <td style="text-align: right; width: 48%; direction: rtl; font-size: 14px; line-height: 1.6;">
        أقر أنا المذكورة أعلاه بموافقتي الكاملة وبرغبتي في نقل خدماتي من الكفيل الحالي الى كفيل جديد وقد فوضت مكتب روائس للقيام بكافة الإجراءات اللازمة نيابةً عني، وذلك دون أي ضغط أو إكراه وبكامل إرادتي، كما أقر بأنني على علم تام بجميع الإجراءات المترتبة على هذا القرار، وأتحمل كامل المسؤولية عنه، ولا يوجد لدي أي اعتراض على نقل الخدمات.
      </td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-top: 50px;">
    <tr>
      <td style="text-align: center; width: 50%;">
        <p style="margin-bottom: 40px;">signature / التوقيع</p>
        <p>...................................</p>
      </td>
      <td style="text-align: center; width: 50%;">
        <p style="margin-bottom: 40px;">fingerprint / البصمة</p>
        <p>...................................</p>
      </td>
    </tr>
  </table>
</div>`
  },
  {
    title: 'سند تسليم عاملة منزلية',
    type: 'handover',
    dynamicFields: ["employer_name","employer_id","visa_number","coming_from","mobile","contract_number","worker_name","passport_number","handover_day","handover_date","address"],
    content: `<h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; font-family: 'Amiri', serif;">سند تسليم عاملة منزلية</h2>

<table style="width: 100%; border-collapse: collapse; margin-top: 20px; direction: rtl; font-family: 'Amiri', serif;">
  <tr>
    <td style="border: 1px solid #000; padding: 10px; width: 50%; text-align: right;">
      <strong>صاحب العمل:</strong> <span style="direction: ltr; unicode-bidi: isolate;">{employer_name}</span>
    </td>
    <td style="border: 1px solid #000; padding: 10px; width: 50%; text-align: right;">
      <strong>رقم الهوية:</strong> <span style="direction: ltr; unicode-bidi: isolate;">{employer_id}</span>
    </td>
  </tr>
  <tr>
    <td style="border: 1px solid #000; padding: 10px; text-align: right;">
      <strong>رقم التأشيرة:</strong> <span style="direction: ltr; unicode-bidi: isolate;">{visa_number}</span>
    </td>
    <td style="border: 1px solid #000; padding: 10px; text-align: right;">
      <strong>جهة القدوم:</strong> <span style="direction: ltr; unicode-bidi: isolate;">{coming_from}</span>
    </td>
  </tr>
  <tr>
    <td style="border: 1px solid #000; padding: 10px; text-align: right;">
      <strong>الجوال:</strong> <span style="direction: ltr; unicode-bidi: isolate;">{mobile}</span>
    </td>
    <td style="border: 1px solid #000; padding: 10px; text-align: right;">
      <strong>رقم عقد التوسط:</strong> <span style="direction: ltr; unicode-bidi: isolate;">{contract_number}</span>
    </td>
  </tr>
  <tr>
    <td style="border: 1px solid #000; padding: 10px; text-align: right;">
      <strong>اسم العاملـ/ـة المنزلية:</strong> <span style="direction: ltr; unicode-bidi: isolate;">{worker_name}</span>
    </td>
    <td style="border: 1px solid #000; padding: 10px; text-align: right;">
      <strong>رقم الجواز:</strong> <span style="direction: ltr; unicode-bidi: isolate;">{passport_number}</span>
    </td>
  </tr>
</table>

<p style="margin-top: 30px; text-align: right; line-height: 2; direction: rtl; font-family: 'Amiri', serif;">
أقر أنا المستلم: <span style="font-weight: bold;">{employer_name}</span>، هوية رقم: <span style="font-weight: bold;">{employer_id}</span>
<br>
بأنني قد استلمت العاملة المنزلية الموضح بياناتها أعلاه وذلك يوم: <span style="font-weight: bold;">{handover_day}</span>، الموافق: <span style="font-weight: bold;">{handover_date}</span> م
<br>
وبذلك قد أخلى مكتب روائس مسؤوليته منذ استلامي للعاملة.
</p>

<p style="margin-top: 20px; font-weight: bold; text-decoration: underline; text-align: right; direction: rtl; font-family: 'Amiri', serif;">
ملاحظة/ يجب على صاحب العمل إجراء الفحص الطبي للعاملة (فحص العمالة)، واستكمال إصدار الإقامة قبل انتهاء فترة التجربة البالغة (90) يوماً.
</p>

<div style="margin-top: 50px; text-align: right; direction: rtl; font-family: 'Amiri', serif;">
  <p><strong>صاحب العمل:</strong></p>
  <p>الاسم/ {employer_name}</p>
  <p>الجوال/ {mobile}</p>
  <p>العنوان/ {address}</p>
  <p>التوقيع/ ....................................</p>
</div>`
  },
  {
    title: 'سند استلام عاملة',
    type: 'worker_receipt',
    dynamicFields: ["employer_name","employer_id","worker_name","nationality","passport_number","refund_amount","date"],
    content: `<div style="direction: rtl; text-align: right; font-family: 'Amiri', serif;">
      <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">سند استلام عاملة</h2>
      <p>التاريخ: {date}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px;">صاحب العمل: {employer_name}</td>
          <td style="border: 1px solid #000; padding: 8px;">رقم الهوية: {employer_id}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;">بأني سلمت العاملة: {worker_name}</td>
          <td style="border: 1px solid #000; padding: 8px;">الجنسية: {nationality} | جواز: {passport_number}</td>
        </tr>
        <tr>
          <td colspan="2" style="border: 1px solid #000; padding: 8px; text-align: center;">إلى مكتب روائس للاستقدام</td>
        </tr>
      </table>
      <br/>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="border: 1px solid #000; padding: 5px;">الفحص الطبي: [ ] تم [ ] لم يتم</td>
          <td style="border: 1px solid #000; padding: 5px;">استلام جواز السفر: [ ] تم [ ] لم يتم</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 5px;">استلام الإقامة: [ ] تم [ ] لم يتم</td>
          <td style="border: 1px solid #000; padding: 5px;">استلام المستحقات: [ ] تم [ ] لم يتم</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 5px;">نوع التأشيرة: [ ] مدفوعة [ ] التأهيل</td>
          <td style="border: 1px solid #000; padding: 5px;">فترة التجربة: [ ] تشمل [ ] خارج</td>
        </tr>
      </table>
      <br/>
      <p>وذلك بمحض ارادتي وارجو من المكتب حل مشكلتها وذلك بالتشاور مع المكتب الخارجي، كما اتعهد بعدم قيامي بأي اجراء ضدها الا بتعميد المكتب واقر بعدم عمل خروج نهائي او بلاغ هروب للعاملة بعد تسليمها للمكتب.</p>
      <p>علماً بأنه سيتم انهاء إجراءات العاملة المنزلية وفق النظام اما بنقل خدماتها او ترحيلها، كما أتعهد بالالتزام مع المكتب اذا طلب مني إصدار خروج نهائي او إصدار الإقامة في حال نقل الخدمات الى حين الانتهاء من إجراءات العاملة المنزلية.</p>
      <p>المبلغ المسترد: {refund_amount} ريال بعد تطبيق المعادلة النظامية.</p>
      <br/>
      <p><strong>صاحب العمل:</strong> {employer_name}</p>
      <p>التوقيع: ...........................................</p>
    </div>`
  },
  {
    title: 'عقد نقل خدمات',
    type: 'transfer_contract',
    dynamicFields: ["employer_name","nationality","id_number","birth_date","worker_name","worker_nationality","passport_number","trial_days","start_date","end_date","amount","date"],
    content: `<div style="direction: rtl; text-align: right; font-family: 'Amiri', serif; font-size: 12px;">
      <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px;">عقد نقل خدمات</h2>
      <p>التاريخ: {date}</p>
      <p><strong>الطرف الأول:</strong> مكتب روائس للاستقدام</p>\n      <p><strong>الطرف الثاني:</strong></p>
      <p>الاسم: {employer_name} | الجنسية: {nationality} | رقم الهوية: {id_number} | تاريخ الميلاد: {birth_date}</p>
      <p>تم الاتفاق بين الطرفين على نقل خدمات العاملة المنزلية: {worker_name}</p>
      <p>الجنسية: {worker_nationality} | جواز رقم: {passport_number}</p>
      <p>بعد انتهاء فترة التجربة: {trial_days} أيام، والتي تبدأ من تاريخ {start_date} وتنتهي بتاريخ {end_date} بمبلغ وقدره ({amount}) ريال.</p>
      <br/>
      <p><strong>بنود العقد:</strong></p>
      <p>1. المسؤولية خلال فترة التجربة: يتحمل الطرف الثاني كامل المسؤولية عن العاملة من تاريخ استلامها.</p>
      <p>2. في حال عدم الرغبة في استمرار العاملة يلتزم الطرف الثاني بإعادتها للمكتب مع دفع 50 ريال عن كل يوم تجربة.</p>
      <p>3. يلتزم الطرف الأول برد المبلغ المستحق في حال الاسترجاع خلال 5 أيام عمل.</p>
      <br/><br/>
      <div style="display: flex; justify-content: space-between;">
        <div>
          <p><strong>الطرف الأول</strong></p>
          <p>مكتب روائس للاستقدام</p>
          <p>التوقيع: .......................</p>
        </div>
        <div>
          <p><strong>الطرف الثاني</strong></p>
          <p>الاسم: {employer_name}</p>
          <p>التوقيع: .......................</p>
        </div>
      </div>
    </div>`
  },
  {
    title: 'نموذج الاستقدام',
    type: 'recruitment_form',
    dynamicFields: ["client_name","id_number","birth_date","visa_number","visa_date","mobile_1","address","worker_nationality","worker_profession","worker_religion","date"],
    content: `<div style="direction: rtl; text-align: right; font-family: 'Amiri', serif;">
      <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">بيانات العميل والشروط والتفضيلات المطلوبة بالعاملة المنزلية</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px;">الاسم: {client_name}</td>
          <td style="border: 1px solid #000; padding: 8px;">رقم الهوية: {id_number}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;">تاريخ الميلاد: {birth_date}</td>
          <td style="border: 1px solid #000; padding: 8px;">رقم التأشيرة: {visa_number}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;">جوال: {mobile_1}</td>
          <td style="border: 1px solid #000; padding: 8px;">العنوان: {address}</td>
        </tr>
      </table>
      <br/>
      <h3 style=\"background: #f0f0f0; padding: 5px;\">الشروط المطلوبة بالعاملة المنزلية</h3>
      <p>الجنسية: {worker_nationality} | المهنة: {worker_profession} | الديانة: {worker_religion}</p>
      <br/><br/>
      <p>اسم مقدم الطلب: {client_name}</p>
      <p>التوقيع: ...........................................</p>
      <p>التاريخ: {date}</p>
    </div>`
  }
];

async function seed() {
  console.log('Start seeding templates...');
  for (const t of templates) {
    try {
      const existing = await prisma.template.findFirst({ where: { title: t.title } });
      if (existing) {
        await prisma.template.update({
          where: { id: existing.id },
          data: {
            content: t.content,
            dynamicFields: JSON.stringify(t.dynamicFields)
          }
        });
        console.log(`Updated template: ${t.title}`);
      } else {
        await prisma.template.create({
          data: {
            title: t.title,
            type: t.type,
            content: t.content,
            dynamicFields: JSON.stringify(t.dynamicFields)
          }
        });
        console.log(`Created template: ${t.title}`);
      }
    } catch (err) {
      console.error(`Error processing template ${t.title}:`, err.message);
    }
  }
  console.log('Seeding finished.');
  await prisma.$disconnect();
}

seed();
