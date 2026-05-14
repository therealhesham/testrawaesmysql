const fs = require('fs');

const header = `
<div class="official-header" style="width: 100%; margin-bottom: 20px; font-family: 'Amiri', serif; direction: rtl;">
  <div style="display: flex; justify-content: space-between; align-items: center; direction: ltr;">
    <div style="text-align: left; width: 33.33%; font-family: Arial, sans-serif;">
      <h2 style="margin: 0; font-size: 18px; color: #00334e; font-weight: bold; white-space: nowrap;">Rawaes Recruitment</h2>
      <div style="margin-top: 8px; font-size: 11px; color: #00334e; line-height: 1.4;">
        <p style="margin: 0;">C.R: 465229226</p>
        <p style="margin: 0;">T.N: 302279841100003</p>
      </div>
    </div>
    <div style="width: 33.33%; text-align: center; display: flex; justify-content: center; align-items: center;">
      <img src="/images/coloredlogo.png" alt="Rawaes Logo" style="max-height: 85px; width: auto; display: block; margin: 0 auto;" />
    </div>
    <div style="text-align: right; width: 33.33%; direction: rtl; font-family: 'Amiri', serif;">
      <h2 style="margin: 0; font-size: 20px; color: #00334e; font-weight: bold; white-space: nowrap;">روائس للاستقدام</h2>
      <div style="margin-top: 8px; font-size: 12px; color: #00334e; line-height: 1.4;">
        <p style="margin: 0;">REC@RAWAES.COM</p>
        <p style="margin: 0; direction: ltr;">+966558255050</p>
        <p style="margin: 0; direction: ltr;">+966558255430</p>
      </div>
    </div>
  </div>
  <div style="border-top: 4px solid #b8975a; margin-top: 15px; margin-bottom: 2px;"></div>
  <div style="border-top: 1px solid #1a365d; margin-bottom: 20px;"></div>
</div>
`;

const dateSection = `
<div style="float: right; width: 220px; text-align: right; margin-bottom: 20px; font-family: 'Amiri', serif;">
  <div style="margin-bottom: 5px;">
    <strong>التاريخ:</strong> {hijri_date} هـ
  </div>
  <div>
    <strong>الموافق:</strong> {gregorian_date} م
  </div>
</div>
<div style="clear: both;"></div>
`;

const officialBottomFooter = `
<div style="width: 100%;">
  <!-- الخطوط تمت إزالتها بناءً على طلب المستخدم -->
  <div style="background-color: #00334e; color: white; padding: 10px; text-align: center; font-family: 'Amiri', serif;">
    <div style="font-size: 13px; font-weight: bold; margin-bottom: 2px;">
      المركز الرئيسي : المدينة المنورة - طريق الملك عبدالله (الدائري الثاني) - حي العريض
    </div>
    <div style="font-size: 10px; font-family: Arial, sans-serif; direction: ltr;">
      Head Office: Medina - King Abdullah Road (Second Ring Road) - Al-Arrayed District
    </div>
  </div>
</div>
`;

const footer = `
<div style="margin-top: 60px; direction: rtl; font-family: 'Amiri', serif;">
  <div style="width: 100%; text-align: right;">
    <p style="font-weight: bold; margin-bottom: 15px;">صاحب العمل / المستلم:</p>
    <br/>
    <p>الاسم: ....................................</p>
    <p>التوقيع: ....................................</p>
  </div>
</div>
`;

const handoverFooter = `
<div style="margin-top: 50px; direction: rtl; font-family: 'Amiri', serif;">
  <div style="width: 100%; text-align: right;">
    <p style="font-weight: bold; margin-bottom: 20px; font-size: 16px;">صاحب العمل / المستلم:</p>
    <div style="line-height: 2;">
      <p style="margin: 0;">الاسم: <strong>{employer_name3}</strong></p>
      <p style="margin: 0;">الجوال: <strong>{mobile2}</strong></p>
      <p style="margin: 0;">العنوان: <strong>{address}</strong></p>
      <p style="margin: 0;">التوقيع: </p>
    </div>
  </div>
</div>
`;

const getTemplateContent = (bodyContent, customFooter = '') => `
<div style="font-family: 'Amiri', serif; color: #000; direction: rtl; width: 100%; background: white; position: relative;">
  <style>
    .fixed-header-container { 
      position: absolute; 
      top: 0; 
      left: 0; 
      right: 0; 
      padding: 40px 40px 0 40px; 
      background: white; 
      z-index: 1000; 
    }
    .fixed-footer-container { 
      position: absolute; 
      bottom: 30px; 
      left: 0; 
      right: 0; 
      padding: 0 40px; 
      background: white; 
      z-index: 1000; 
    }
    @media print {
      .fixed-header-container { position: fixed !important; }
      .fixed-footer-container { position: fixed !important; }
    }
  </style>

  <!-- الهيدر والفوتر الثابتين -->
  <div class="fixed-header-container">
    ${header}
  </div>

  <div class="fixed-footer-container">
    ${officialBottomFooter}
  </div>

  <!-- جدول المحتوى مع مساحات محجوزة (Spacers) للهيدر والفوتر -->
  <table style="width: 100%; border: none; border-collapse: collapse; margin: 0; padding: 0;">
    <thead>
      <tr><td style="border: none; padding: 0; height: 150px;"></td></tr> <!-- العودة للقيمة الأصلية 150px -->
    </thead>
    <tbody>
      <tr><td style="border: none; padding: 0; vertical-align: top;">
        <div style="padding: 20px 40px; min-height: 400px;"> <!-- العودة للقيمة الأصلية 20px padding -->
          ${bodyContent}
          <div style="margin-top: 30px;"> <!-- العودة للقيمة الأصلية 30px -->
            ${customFooter}
          </div>
        </div>
      </td></tr>
    </tbody>
    <tfoot>
      <tr><td style="border: none; padding: 0; height: 180px;"></td></tr> <!-- العودة للقيمة الأصلية 180px -->
    </tfoot>
  </table>
</div>
` ;

const templates = [
  {
    title: "إقرار استلام مستحقات (مخالصة نهائية)",
    type: "settlement",
    dynamicFields: ["worker_name1","worker_name2","worker_name3","nationality1","nationality2","id_number1","id_number2","employer_name1","employer_name2","period_from","period_to","hijri_date","gregorian_date"],
    content: getTemplateContent(`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        <div style="text-align: right; font-size: 14px; line-height: 1.4; width: 220px;">
          <p style="margin: 0;">التاريخ: {hijri_date} هـ</p>
          <p style="margin: 0;">الموافق: {gregorian_date} م</p>
        </div>
        <div style="text-align: center; flex-grow: 1;">
          <h2 style="margin: 0; font-size: 20px; font-family: Arial, sans-serif;">Final Settlement Receipt</h2>
          <h2 style="margin: 2px 0 0 0; font-size: 18px; text-decoration: underline;">إقرار استلام مستحقات (مخالصة نهائية)</h2>
        </div>
        <div style="width: 220px;"></div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: bold; font-size: 16px;">
        <span>أنا الموقعة أدناه:</span>
        <span style="font-family: Arial, sans-serif; direction: ltr;">I, the undersigned:</span>
      </div>

      <div style="margin-bottom: 4px; display: flex; align-items: baseline; direction: ltr;">
        <span style="white-space: nowrap; width: 100px; font-family: Arial, sans-serif; direction: ltr; font-size: 14px;">Name:</span>
        <div style="flex-grow: 1; border-bottom: none; text-align: center; font-weight: bold; font-size: 16px; margin: 0 10px;">{worker_name1}</div>
        <span style="white-space: nowrap; width: 100px; text-align: right; direction: rtl; font-size: 14px;">الاسم:</span>
      </div>

      <div style="margin-bottom: 12px; display: flex; align-items: baseline; direction: ltr;">
        <span style="white-space: nowrap; width: 100px; font-family: Arial, sans-serif; direction: ltr;">Nationality:</span>
        <div style="flex-grow: 1; border-bottom: none; text-align: center; font-weight: bold; font-size: 18px; margin: 0 10px;">{nationality1}</div>
        <span style="white-space: nowrap; width: 100px; text-align: right; direction: rtl;">الجنسية:</span>
      </div>

      <div style="margin-bottom: 12px; display: flex; align-items: baseline; direction: ltr;">
        <span style="white-space: nowrap; width: 120px; font-family: Arial, sans-serif; direction: ltr;">Iqama / ID No.:</span>
        <div style="flex-grow: 1; border-bottom: none; text-align: center; font-weight: bold; font-size: 18px; margin: 0 10px;">{id_number1}</div>
        <span style="white-space: nowrap; width: 120px; text-align: right; direction: rtl;">رقم الإقامة / الهوية:</span>
      </div>

      <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-start; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
        <p style="width: 48%; margin: 0; text-align: right; line-height: 1.4; direction: rtl;">أقر بأنني استلمت كافة مستحقاتي المالية من صاحب العمل:</p>
        <p style="width: 48%; margin: 0; text-align: left; font-family: Arial, sans-serif; line-height: 1.4; direction: ltr;">I hereby acknowledge that I have received all my financial dues from my employer:</p>
      </div>

      <div style="margin-bottom: 8px; display: flex; align-items: baseline; direction: ltr;">
        <span style="white-space: nowrap; width: 130px; font-family: Arial, sans-serif; direction: ltr; font-size: 14px;">Employer Name:</span>
        <div style="flex-grow: 1; border-bottom: none; text-align: center; font-weight: bold; font-size: 16px; margin: 0 10px;">{employer_name1}</div>
        <span style="white-space: nowrap; width: 130px; text-align: right; direction: rtl; font-size: 14px;">اسم صاحب العمل:</span>
      </div>

      <div style="margin-bottom: 8px; display: flex; align-items: baseline; direction: ltr; font-size: 13px;">
        <span style="white-space: nowrap; font-family: Arial, sans-serif; direction: ltr;">For the period from:</span>
        <div style="width: 100px; border-bottom: none; text-align: center; font-weight: bold; margin: 0 5px;">{period_from}</div>
        <span style="white-space: nowrap; font-family: Arial, sans-serif; direction: ltr;">to:</span>
        <div style="width: 100px; border-bottom: none; text-align: center; font-weight: bold; margin: 0 5px;">{period_to}</div>
        <span style="white-space: nowrap; text-align: right; direction: rtl; flex-grow: 1;">وذلك عن فترة عملي من تاريخ إلى تاريخ:</span>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; margin-bottom: 5px; font-size: 16px;">
        <span style="direction: rtl;">وتشمل هذه المستحقات:</span>
        <span style="font-family: Arial, sans-serif; direction: ltr;">This includes the following dues:</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; padding: 0 20px; font-size: 14px;">
        <span style="direction: rtl;">- الرواتب</span>
        <span style="font-family: Arial, sans-serif; direction: ltr;">- Salaries</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 0 20px;">
        <span style="direction: rtl;">- بدل الإجازات (إن وجد)</span>
        <span style="font-family: Arial, sans-serif; direction: ltr;">- Leave compensation (if any)</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 0 20px;">
        <span style="direction: rtl;">- مكافأة نهاية الخدمة (إن وجدت)</span>
        <span style="font-family: Arial, sans-serif; direction: ltr;">- End of service benefits (if any)</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 0 20px;">
        <span style="direction: rtl;">- أي مستحقات أخرى</span>
        <span style="font-family: Arial, sans-serif; direction: ltr;">- Any other dues</span>
      </div>

      <div style="margin-top: 8px; padding-top: 5px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
          <span style="direction: rtl; font-size: 15px;">إقرار بإخلاء الطرف</span>
          <span style="font-family: Arial, sans-serif; direction: ltr; font-size: 16px;">Discharge Acknowledgment</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; color: #333;">
          <p style="width: 48%; margin: 0; text-align: right; direction: rtl; line-height: 1.3; font-size: 13px;">أقّر تماماً بأنه ليس لدي أي مطالبات مالية أو قانونية أخرى ضد صاحب العمل أو مكتب روائس بعد توقيع هذه الوثيقة.</p>
          <p style="width: 48%; margin: 0; text-align: left; font-family: Arial, sans-serif; line-height: 1.3; font-size: 13px;">I fully acknowledge that I have no other financial or legal claims against my employer or Rawaes office after signing this document.</p>
        </div>
      </div>
    `, `
      <div style="margin-top: 5px;">
        <div style="margin-bottom: 5px; display: flex; align-items: baseline; direction: ltr;">
          <span style="white-space: nowrap; width: 100px; font-family: Arial, sans-serif; direction: ltr;">Name:</span>
          <div style="flex-grow: 1; border-bottom: none; text-align: center; font-weight: bold; font-size: 18px; margin: 0 10px;">{worker_name3}</div>
          <span style="white-space: nowrap; width: 100px; text-align: right; direction: rtl;">الاسم:</span>
        </div>
        <div style="margin-bottom: 5px; display: flex; align-items: baseline; direction: ltr;">
          <span style="white-space: nowrap; width: 100px; font-family: Arial, sans-serif; direction: ltr;">Date:</span>
          <div style="flex-grow: 1; border-bottom: none; text-align: center; font-weight: bold; font-size: 18px; margin: 0 10px;">{gregorian_date}</div>
          <span style="white-space: nowrap; width: 100px; text-align: right; direction: rtl;">التاريخ:</span>
        </div>
        <div style="margin-bottom: 5px; display: flex; align-items: baseline; direction: ltr;">
          <span style="white-space: nowrap; width: 100px; font-family: Arial, sans-serif; direction: ltr;">Signature:</span>
          <div style="flex-grow: 1; border-bottom: none; margin: 0 10px;"></div>
          <span style="white-space: nowrap; width: 100px; text-align: right; direction: rtl;">التوقيع:</span>
        </div>
      </div>
    `)
  },
  {
    title: "إقرار موافقة نقل خدمات",
    type: "consent",
    dynamicFields: ["worker_name1","worker_name2","id_number","nationality","passport_number","hijri_date","gregorian_date"],
    content: getTemplateContent(`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        <div style="text-align: right; font-size: 14px; line-height: 1.4; width: 220px;">
          <p style="margin: 0;">التاريخ: {hijri_date} هـ</p>
          <p style="margin: 0;">الموافق: {gregorian_date} م</p>
        </div>
        <div style="text-align: center; flex-grow: 1;">
          <h2 style="margin: 0; font-size: 20px; text-decoration: underline;">إقرار موافقة نقل خدمات</h2>
        </div>
        <div style="width: 220px;"></div>
      </div>
      
      <div style="margin-bottom: 10px; line-height: 1.6; border-bottom: 1px dotted #ccc; padding-bottom: 5px;">
        أقر أنا العاملة: <strong>{worker_name1}</strong> ، هوية رقم: <strong>{id_number}</strong>
      </div>
      <div style="margin-bottom: 12px; line-height: 1.6; border-bottom: 1px dotted #ccc; padding-bottom: 5px;">
        الجنسية: <strong>{nationality}</strong> ، جواز رقم: <strong>{passport_number}</strong>
      </div>
      
      <div style="line-height: 1.6; text-align: justify; margin-bottom: 18px; font-size: 15px;">
        أقر أنا المذكورة أعلاه بموافقتي الكاملة وبرغبتي في نقل خدماتي من الكفيل الحالي الى كفيل جديد وقد فوضت مكتب روائس للقيام بكافة الإجراءات اللازمة نيابةً عني، وذلك دون أي ضغط أو إكراه وبكامل إرادتي، كما أقر بأنني على علم تام بجميع الإجراءات المترتبة على هذا القرار، وأتحمل كامل المسؤولية عنه، ولا يوجد لدي أي اعتراض على نقل الخدمات.
      </div>
      
      <div style="display: flex; justify-content: space-around; margin-bottom: 20px; text-align: center;">
        <div style="width: 200px;">
          <p style="margin-bottom: 18px; font-weight: bold;">التوقيع</p>
          <p>..........................</p>
        </div>
        <div style="width: 200px;">
          <p style="margin-bottom: 18px; font-weight: bold;">البصمة</p>
          <p>..........................</p>
        </div>
      </div>
      
      <div style="border-top: 2px dashed #333; margin: 20px 0;"></div>
      
      <div style="direction: ltr; text-align: left; font-family: Arial, sans-serif;">
        
        <h2 style="text-align: center; text-decoration: underline; margin-bottom: 18px; font-size: 18px; font-weight: bold;">Consent Declaration for Transfer of Sponsorship</h2>
        
        <div style="margin-bottom: 10px; line-height: 1.6; border-bottom: 1px dotted #ccc; padding-bottom: 5px;">
          I, the worker: <strong>{worker_name1}</strong> , Holder of ID No.: <strong>{id_number}</strong>
        </div>
        <div style="margin-bottom: 12px; line-height: 1.6; border-bottom: 1px dotted #ccc; padding-bottom: 5px;">
          Nationality: <strong>{nationality}</strong> , Passport No.: <strong>{passport_number}</strong>
        </div>
        
        <div style="line-height: 1.5; text-align: justify; margin-bottom: 18px; font-size: 14px;">
          Hereby declare my full consent and willingness to transfer my sponsorship from my current sponsor to a new sponsor. I have authorized Rawaes Office to complete all necessary procedures on my behalf, without any pressure or coercion, and with my full free will. I also acknowledge that I am fully aware of all procedures and consequences resulting from this decision, and I bear full responsibility for it. I have no objection to the transfer of my sponsorship.
        </div>
        
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div style="width: 200px;">
            <p style="margin-bottom: 18px; font-weight: bold;">signature</p>
            <p>..........................</p>
          </div>
          <div style="width: 200px;">
            <p style="margin-bottom: 18px; font-weight: bold;">fingerprint</p>
            <p>..........................</p>
          </div>
        </div>
      </div>
    `, ``)
  },
  {
    title: "سند تسليم عاملة منزلية",
    type: "handover",
    dynamicFields: ["employer_name1","employer_name2","employer_name3","employer_id1","employer_id2","visa_number","coming_from","mobile1","mobile2","contract_number","worker_name","passport_number","handover_day","handover_date","address","hijri_date","gregorian_date"],
    content: getTemplateContent(`
      ${dateSection}
      <h2 style="text-align: center; text-decoration: underline; margin-bottom: 30px; font-size: 22px;">سند تسليم عاملة منزلية</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #000;">
        <tr><td style="border: 1px solid #000; padding: 10px; background: #f9f9f9; width: 25%;">صاحب العمل</td><td style="border: 1px solid #000; padding: 10px; width: 25%;">{employer_name1}</td><td style="border: 1px solid #000; padding: 10px; background: #f9f9f9; width: 25%;">رقم الهوية</td><td style="border: 1px solid #000; padding: 10px; width: 25%;">{employer_id1}</td></tr>
        <tr><td style="border: 1px solid #000; padding: 10px; background: #f9f9f9;">رقم التأشيرة</td><td style="border: 1px solid #000; padding: 10px;">{visa_number}</td><td style="border: 1px solid #000; padding: 10px; background: #f9f9f9;">جهة القدوم</td><td style="border: 1px solid #000; padding: 10px;">{coming_from}</td></tr>
        <tr><td style="border: 1px solid #000; padding: 10px; background: #f9f9f9;">الجوال</td><td style="border: 1px solid #000; padding: 10px;">{mobile1}</td><td style="border: 1px solid #000; padding: 10px; background: #f9f9f9;">رقم العقد</td><td style="border: 1px solid #000; padding: 10px;">{contract_number}</td></tr>
        <tr><td style="border: 1px solid #000; padding: 10px; background: #f9f9f9;">اسم العاملة</td><td style="border: 1px solid #000; padding: 10px;">{worker_name}</td><td style="border: 1px solid #000; padding: 10px; background: #f9f9f9;">رقم الجواز</td><td style="border: 1px solid #000; padding: 10px;">{passport_number}</td></tr>
      </table>

      <p>أقر أنا المستلم: <strong>{employer_name2}</strong>، هوية رقم: <strong>{employer_id2}</strong></p>
      <p>بأنني قد استلمت العاملة المنزلية الموضح بياناتها أعلاه وذلك يوم: <strong>{handover_day}</strong>، الموافق: <strong>{handover_date}</strong> م</p>
      
      <p style="font-weight: bold; text-decoration: underline; margin-top: 20px;">ملاحظة هامة:</p>
      <p>يجب على صاحب العمل إجراء الفحص الطبي للعاملة واستكمال إصدار الإقامة قبل انتهاء فترة التجربة (90 يوماً).</p>
    `, `${handoverFooter}`)
  },
  {
    title: "سند استلام عاملة",
    type: "worker_receipt",
    dynamicFields: ["employer_name1","employer_name2","employer_name3","employer_id1","employer_id2","mobile2","worker_name","nationality","passport_number","refund_amount","hijri_date","gregorian_date"],
    content: getTemplateContent(`
      ${dateSection}
      <h2 style="text-align: center; text-decoration: underline; margin-bottom: 15px; font-size: 20px;">سند استلام عاملة</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13.5px;">
        <tr>
          <td style="border: 1px solid #000; padding: 5px; background: #f9f9f9; width: 15%; font-weight: bold;">صاحب العمل</td>
          <td style="border: 1px solid #000; padding: 5px; width: 45%;">{employer_name1}</td>
          <td style="border: 1px solid #000; padding: 5px; background: #f9f9f9; width: 15%; font-weight: bold;">رقم الهوية</td>
          <td style="border: 1px solid #000; padding: 5px; width: 25%;">{employer_id1}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 5px; background: #f9f9f9; font-weight: bold;">بأنني سلمت العاملة</td>
          <td style="border: 1px solid #000; padding: 5px;">{worker_name}</td>
          <td colspan="2" style="border: 1px solid #000; padding: 0;">
            <table style="width: 100%; border-collapse: collapse; border: none;">
              <tr>
                <td style="border-left: 1px solid #000; padding: 5px; background: #f9f9f9; width: 30%; font-weight: bold;">الجنسية</td>
                <td style="border-left: 1px solid #000; padding: 5px; width: 25%;">{nationality}</td>
                <td style="border-left: 1px solid #000; padding: 5px; background: #f9f9f9; width: 25%; font-weight: bold;">رقم الجواز</td>
                <td style="padding: 5px;">{passport_number}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 5px; background: #f9f9f9; font-weight: bold;">إلى مكتب</td>
          <td colspan="3" style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">روائس للاستقدام</td>
        </tr>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12.5px; text-align: center;">
        <tr>
          <td style="border: 1px solid #000; padding: 5px; background: #f9f9f9; width: 20%; font-weight: bold;">الفحص الطبي</td>
          <td style="border: 1px solid #000; padding: 5px; width: 30%;">
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> تم &nbsp;&nbsp;
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> لم يتم
          </td>
          <td style="border: 1px solid #000; padding: 5px; background: #f9f9f9; width: 25%; font-weight: bold;">استلام العاملة جواز السفر</td>
          <td style="border: 1px solid #000; padding: 5px; width: 25%;">
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> تم &nbsp;&nbsp;
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> لم يتم
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 5px; background: #f9f9f9; font-weight: bold;">استلام العاملة الإقامة</td>
          <td style="border: 1px solid #000; padding: 5px;">
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> تم &nbsp;&nbsp;
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> لم يتم
          </td>
          <td style="border: 1px solid #000; padding: 5px; background: #f9f9f9; font-weight: bold;">استلام العاملة مستحقاتها</td>
          <td style="border: 1px solid #000; padding: 5px;">
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> تم &nbsp;&nbsp;
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> لم يتم
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 5px; background: #f9f9f9; font-weight: bold;">نوع التأشيرة</td>
          <td style="border: 1px solid #000; padding: 5px;">
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> مدفوعة &nbsp;&nbsp;
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> التأهيل
          </td>
          <td style="border: 1px solid #000; padding: 5px; background: #f9f9f9; font-weight: bold;">فترة التجربة</td>
          <td style="border: 1px solid #000; padding: 5px;">
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> تشمل &nbsp;&nbsp;
            <span style="border: 1px solid #000; display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-left: 5px;"></span> خارج
          </td>
        </tr>
      </table>

      <div style="font-size: 13px; line-height: 1.45; text-align: justify; margin-bottom: 12px;">
        <p style="margin-bottom: 8px;">وذلك بمحض إرادتي وأرجو من المكتب حل مشكلتها وذلك بالتشاور مع المكتب الخارجي، كما أتعهد بعدم قيامي بأي إجراء ضدها إلا بتعميد المكتب وأقر بعدم عمل خروج نهائي أو بلاغ هروب للعاملة بعد تسليمها للمكتب.</p>
        
        <p style="margin-bottom: 8px;">علماً بأنه سيتم إنهاء إجراءات العاملة المنزلية وفق النظام إما بنقل خدماتها أو ترحيلها، كما أتعهد بالالتزام مع المكتب إذا طلب مني إصدار خروج نهائي أو إصدار الإقامة في حال نقل الخدمات إلى حين الانتهاء من إجراءات العاملة المنزلية.</p>
        
        <p style="margin-bottom: 8px;">ويحق لي استرداد مبلغ التعاقد في حال تم تسليم العاملة خلال فترة التجربة وبعد الانتهاء من إجراءات العاملة، حيث تم إفهامي بأن المبلغ المسترد يكون وفقاً للعقد ومعادلة وزارة الموارد البشرية والتنمية الاجتماعية التي تنص على:<br/>
        <strong>(إجمالي تكلفة الاستقدام ÷ مدة عقد عمل العامل المنزلي بالأيام) × (المدة المتبقية من مدة عقد عمل العامل المنزلي بالأيام).</strong></p>
      </div>

      <div style="border: 1px solid #000; padding: 8px; margin-bottom: 12px; font-size: 13.5px;">
        المبلغ المسترد: <strong>{refund_amount}</strong> ريال بعد تطبيق المعادلة بالإضافة إلى رسوم مبلغ التأشيرة في حال تم نقل خدمات العاملة المنزلية.
      </div>

      <p style="font-size: 12.5px; font-weight: bold; text-decoration: underline; margin-bottom: 15px;">ملاحظة/ في حال كانت التأشيرة مستخرجة من التأهيل الشامل أو ذوي الاحتياجات الخاصة تكون غير مستردة القيمة.</p>

      <div style="display: flex; justify-content: flex-start; gap: 60px; font-size: 13.5px;">
        <div style="width: 300px; line-height: 1.8;">
          <p style="font-weight: bold; margin-bottom: 5px;">صاحب العمل: -</p>
          <p style="margin: 0;">الاسم/ {employer_name3}</p>
          <p style="margin: 0;">الجوال/ {mobile2}</p>
          <p style="margin: 0;">التوقيع/ ..............................</p>
        </div>
      </div>
    `)
  },
  {
    title: "عقد نقل خدمات",
    type: "transfer_contract",
    dynamicFields: ["employer_name1","employer_name2","nationality","id_number1","id_number2","mobile1","birth_date","worker_name","worker_nationality","passport_number","trial_days","start_date_h","end_date_h","start_date_g","end_date_g","amount_text","hijri_date","gregorian_date"],
    content: getTemplateContent(`
      ${dateSection}
      <h2 style="text-align: center; text-decoration: underline; margin-bottom: 10px; font-size: 18px; font-weight: bold;">عقد نقل خدمات</h2>
      
      <div style="margin-bottom: 5px; font-size: 13.5px;">
        <p style="margin-bottom: 2px;"><strong style="text-decoration: underline;">الطرف الأول:</strong> مكتب روائس للاستقدام.</p>
      </div>

      <div style="margin-bottom: 10px; font-size: 13.5px;">
        <p style="margin-bottom: 3px;"><strong style="text-decoration: underline;">الطرف الثاني:</strong></p>
        <div style="margin-bottom: 2px; display: flex; border-bottom: 1px dotted #666; padding-bottom: 1px;">
          <span style="width: 100px;">الاسم/</span>
          <span style="flex-grow: 1; text-align: center; font-weight: bold;">{employer_name1}</span>
        </div>
        <div style="margin-bottom: 2px; display: flex; border-bottom: 1px dotted #666; padding-bottom: 1px;">
          <span style="width: 100px;">الجنسية/</span>
          <span style="flex-grow: 1; text-align: center; font-weight: bold;">{nationality}</span>
        </div>
        <div style="margin-bottom: 2px; display: flex; border-bottom: 1px dotted #666; padding-bottom: 1px;">
          <span style="width: 100px;">رقم الهوية/</span>
          <span style="flex-grow: 1; text-align: center; font-weight: bold;">{id_number1}</span>
        </div>
        <div style="margin-bottom: 2px; display: flex; border-bottom: 1px dotted #666; padding-bottom: 1px;">
          <span style="width: 100px;">تاريخ الميلاد/</span>
          <span style="flex-grow: 1; text-align: center; font-weight: bold;">{birth_date}</span>
        </div>
      </div>

      <div style="line-height: 1.4; margin-bottom: 10px; font-size: 13.5px;">
        <div style="border-bottom: 1px dotted #666; padding-bottom: 2px; margin-bottom: 4px;">
          تم الاتفاق بين الطرفين على نقل خدمات العاملة المنزلية/ <strong>{worker_name}</strong>
        </div>
        <div style="border-bottom: 1px dotted #666; padding-bottom: 2px; margin-bottom: 4px;">
          الجنسية/ <strong>{worker_nationality}</strong> &nbsp;&nbsp;&nbsp;&nbsp; جواز رقم/ <strong>{passport_number}</strong>
        </div>
        <div style="border-bottom: 1px dotted #666; padding-bottom: 2px; margin-bottom: 4px;">
          بعد انتهاء فترة التجربة/ <strong>{trial_days}</strong> أيام ( {trial_days} أيام).
        </div>
        <div style="border-bottom: 1px dotted #666; padding-bottom: 2px; margin-bottom: 4px;">
          والتي تبدأ من تاريخ <strong>{start_date_h}</strong> هـ ، وتنتهي بتاريخ <strong>{end_date_h}</strong> هـ.
        </div>
        <div style="border-bottom: 1px dotted #666; padding-bottom: 2px; margin-bottom: 10px;">
          بمبلغ وقدره ( <strong>{amount_text}</strong> ريال).
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; text-align: center;">
        <tr style="background-color: #f2f2f2;">
          <th colspan="6" style="border: 1px solid #000; padding: 3px;">متطلبات نقل الخدمات</th>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 4px; width: 20%; background: #fafafa;">المخالفات المرورية</td>
          <td style="border: 1px solid #000; padding: 4px; width: 25%;">
            ( ) يوجد &nbsp; ( ) لا يوجد
          </td>
          <td style="border: 1px solid #000; padding: 4px; width: 15%; background: #fafafa;">عدد العمالة</td>
          <td style="border: 1px solid #000; padding: 4px; width: 10%;">( )</td>
          <td style="border: 1px solid #000; padding: 4px; width: 20%; background: #fafafa;">إثبات القدرة المالية</td>
          <td style="border: 1px solid #000; padding: 4px; width: 10%;">( )</td>
        </tr>
      </table>

      <div style="font-size: 13.5px; font-weight: bold; margin-bottom: 5px;">بنود العقد: -</div>

      <div style="font-size: 13px; line-height: 1.4; text-align: justify;">
        <p style="margin-bottom: 6px;"><strong>أولاً: المسؤولية خلال فترة التجربة</strong><br/>
        يقر الطرف الثاني بأنه اعتباراً من تاريخ استلام العاملة يتحمل كامل المسؤولية عنها خلال فترة التجربة المحددة أعلاه، وذلك من حيث الهروب أو غيره، دون أدنى مسؤولية على المكتب.</p>

        <p style="margin-bottom: 6px;"><strong>ثانياً: عدم الرغبة في نقل الخدمات خلال فترة التجربة</strong><br/>
        في حال عدم رغبة الطرف الثاني في استمرار العاملة خلال فترة التجربة يلتزم بإعادتها إلى المكتب، مع التزامه بدفع مبلغ وقدره (50 ريال) للعاملة عن كل يوم من أيام التجربة، على أن يتم خصمها من إجمالي المبلغ المدفوع للمكتب.</p>

        <p style="margin-bottom: 6px;"><strong>ثالثاً: الالتزام بإجراءات نقل الخدمات (الطرف الثاني)</strong><br/>
        يتعهد الطرف الثاني بالالتزام بإتمام إجراءات نقل خدمات العاملة خلال المدة المحددة والتعاون التام مع الطرف الأول، وتزويده بكافة المستندات والمتطلبات اللازمة لإتمام عملية النقل.</p>
        
        <p style="page-break-before: always; margin-bottom: 8px; margin-top: 20px;"><strong>رابعاً: التأخير أو عدم إتمام النقل بعد فترة التجربة</strong><br/>
        في حال وجود ما يعيق إتمام إجراءات نقل الخدمات بسبب الطرف الثاني، مثل وجود مخالفات مرورية، أو عدم تقديم إثبات القدرة المالية، أو التأخر في مراجعة الجهات المختصة، أو ما في حكم ذلك, فإنه يتحمل كامل تبعات التأخير، ولا يحق له المطالبة باسترجاع أي مبالغ مدفوعة.</p>



        <p style="margin-bottom: 12px;"><strong>خامساً: عدم المطالبة بعد نقل الخدمة</strong><br/>
        يقر الطرف الثاني بأنه بعد انتهاء فترة التجربة وإتمام نقل خدمات العاملة، لا يحق له الرجوع على الطرف الأول بأي مطالبات، كما أنه لا يقدم الطرف الأول أي ضمانات تتعلق بالعاملة بعد نقل خدماتها، بما في ذلك حالات الهروب أو رفض العمل أو المرض أو ما في حكم ذلك.<br/>
        ويمكن للطرف الثاني في حال رغبته، التعاقد على تأمين خاص بالعاملة بعد نقل خدماتها من خلال الجهات المختصة لتوفير ضمان على العاملة المنزلية.</p>

        <p style="margin-bottom: 12px;"><strong>سادساً: الإقرار بالسداد</strong><br/>
        يقر الطرف الأول باستلام مبلغ نقل خدمات العاملة من الطرف الثاني، وذلك مقابل نقل خدمات العاملة المنزلية.</p>

        <p style="margin-bottom: 12px;"><strong>سابعاً: استرجاع المبلغ المسترد</strong><br/>
        يلتزم الطرف الأول برد المبلغ المستحق للطرف الثاني في حال تم تسليم العاملة خلال فترة التجربة وذلك في مدة لا تتجاوز خمسة أيام عمل من تاريخ استلام العاملة، على أن يتم التحويل إلى نفس الحساب المحول منه، ولا يجوز التحويل إلى حساب طرف ثالث.</p>

        <p style="margin-bottom: 30px;"><strong>ثامناً: الإقرار العام</strong><br/>
        يقر الطرفان بأنهما قد اطلعا على جميع بنود هذا العقد وفهماها فهماً تاماً، وتم الاتفاق عليها برضاهما التام، وعلى ذلك جرى التوقيع.</p>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 20px;">
        <div style="width: 45%; line-height: 2;">
          <p style="font-weight: bold; border-bottom: 1px solid #000; display: inline-block; padding-bottom: 2px;">الطرف الأول</p>
          <p style="margin: 0;">مكتب روائس للاستقدام</p>
          <p style="margin: 0;">التوقيع/ </p>
        </div>
        <div style="width: 45%; line-height: 2;">
          <p style="font-weight: bold; border-bottom: 1px solid #000; display: inline-block; padding-bottom: 2px;">الطرف الثاني</p>
          <p style="margin: 0;">الاسم/ {employer_name2}</p>
          <p style="margin: 0;">الجوال/ {mobile1}</p>
          <p style="margin: 0;">التوقيع/ </p>
        </div>
      </div>
    `)
  },
  {
    title: "نموذج الاستقدام",
    type: "recruitment_form",
    dynamicFields: ["client_name1","client_name2","id_number1","id_number2","birth_date","visa_number","visa_date","mobile_1","address","worker_nationality","worker_profession","worker_religion","hijri_date","gregorian_date"],
    content: getTemplateContent(`
      ${dateSection}
      <h2 style="text-align: center; text-decoration: underline; margin-bottom: 30px; font-size: 22px;">نموذج طلب استقدام</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: none;">
        <tr><td style="border: none; padding: 10px; background: #f9f9f9;">اسم العميل</td><td style="border: none; padding: 10px;">{client_name1}</td></tr>
        <tr><td style="border: none; padding: 10px; background: #f9f9f9;">رقم الهوية</td><td style="border: none; padding: 10px;">{id_number1}</td></tr>
        <tr><td style="border: none; padding: 10px; background: #f9f9f9;">رقم التأشيرة</td><td style="border: none; padding: 10px;">{visa_number}</td></tr>
        <tr><td style="border: none; padding: 10px; background: #f9f9f9;">المواصفات المطلوبة</td><td style="border: none; padding: 10px;">{worker_nationality} | {worker_profession} | {worker_religion}</td></tr>
      </table>

      <div style="margin-top: 40px;">
        <p>اسم العميل: {client_name2}</p>
        <p>الهوية: {id_number2}</p>
        <p>التوقيع: .....................</p>
      </div>
    `)
  },
  {
    title: "تعهد صاحب العمل",
    type: "employer_undertaking",
    dynamicFields: ["employer_name1","employer_name2","id_number1","id_number2","worker_name","hijri_date","gregorian_date"],
    content: getTemplateContent(`
      ${dateSection}
      <h2 style="text-align: center; text-decoration: underline; margin-bottom: 30px; font-size: 22px;">تعهد وإقرار صاحب العمل</h2>
      
      <p>أنا صاحب العمل: <strong>{employer_name1}</strong>، هوية رقم: <strong>{id_number1}</strong></p>
      <p>أتعهد بموجب هذا الإقرار بالمحافظة على حقوق العاملة المنزلية: <strong>{worker_name}</strong>، وتوفير السكن المناسب والمعاملة الحسنة، والالتزام بدفع الرواتب في موعدها المحدد.</p>

      <div style="margin-top: 60px;">
        <p>المتعهد: {employer_name2}</p>
        <p>رقم الهوية: {id_number2}</p>
        <p>التوقيع: ..........................</p>
      </div>
    `)
  },
  {
    title: "إقرار استلام جواز سفر",
    type: "passport_receipt",
    dynamicFields: ["employer_name1","employer_name2","worker_name","passport_number","hijri_date","gregorian_date"],
    content: getTemplateContent(`
      ${dateSection}
      <h2 style="text-align: center; text-decoration: underline; margin-bottom: 30px; font-size: 22px;">إقرار استلام جواز سفر</h2>
      
      <p>أقر أنا: <strong>{employer_name1}</strong></p>
      <p>بأنني استلمت أصل جواز سفر العاملة: <strong>{worker_name}</strong>، رقم الجواز: <strong>{passport_number}</strong></p>
      <p>وأتعهد بالحفاظ عليه وتسليمه عند الطلب.</p>

      <div style="margin-top: 60px;">
        <p>المستلم: {employer_name2}</p>
        <p>التوقيع: ..........................</p>
      </div>
    `)
  },
  {
    title: "طلب استرداد مبلغ",
    type: "refund_request",
    dynamicFields: ["contract_number", "id_number", "client_name", "passport_number", "nationality", "worker_name", "escape_date", "receive_date", "arrival_date", "external_office_name", "refund_amount", "contract_amount", "notes", "hijri_date", "gregorian_date"],
    content: getTemplateContent(`
      <!-- تم نقل الضغط ليكون داخلياً في هذا النموذج فقط -->
      <div style="float: right; width: 220px; text-align: right; margin-bottom: 5px; font-family: 'Amiri', serif; font-size: 11px; margin-top: -10px;">
        <div style="margin-bottom: 2px;"><strong>التاريخ:</strong> {hijri_date} هـ</div>
        <div><strong>الموافق:</strong> {gregorian_date} م</div>
      </div>
      <div style="clear: both;"></div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 11px; text-align: center;">
        <tr style="background: #f2f2f2; font-weight: bold;">
          <td style="border: 1px solid #000; padding: 3px; width: 33.33%;">اسم العميل</td>
          <td style="border: 1px solid #000; padding: 3px; width: 33.33%;">رقم الهوية</td>
          <td style="border: 1px solid #000; padding: 3px; width: 33.33%;">رقم العقد</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 4px;">{client_name}</td>
          <td style="border: 1px solid #000; padding: 4px;">{id_number}</td>
          <td style="border: 1px solid #000; padding: 4px;">{contract_number}</td>
        </tr>
        <tr style="background: #f2f2f2; font-weight: bold;">
          <td style="border: 1px solid #000; padding: 3px;">اسم العاملة المنزلية</td>
          <td style="border: 1px solid #000; padding: 3px;">الجنسية</td>
          <td style="border: 1px solid #000; padding: 3px;">رقم الجواز</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 4px;">{worker_name}</td>
          <td style="border: 1px solid #000; padding: 4px;">{nationality}</td>
          <td style="border: 1px solid #000; padding: 4px;">{passport_number}</td>
        </tr>
        <tr style="background: #f2f2f2; font-weight: bold;">
          <td style="border: 1px solid #000; padding: 3px;">تاريخ الوصول</td>
          <td style="border: 1px solid #000; padding: 3px;">تاريخ الاستلام</td>
          <td style="border: 1px solid #000; padding: 3px;">تاريخ الهروب</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 4px;">{arrival_date}</td>
          <td style="border: 1px solid #000; padding: 4px;">{receive_date}</td>
          <td style="border: 1px solid #000; padding: 4px;">{escape_date}</td>
        </tr>
      </table>

      <h2 style="text-align: center; margin: 5px 0; font-size: 17px; font-weight: bold;">نموذج طلب استرداد مبلغ للعميل</h2>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 11px;">
        <tr style="background: #f2f2f2; font-weight: bold; text-align: center;">
          <td style="border: 1px solid #000; padding: 3px; width: 50%;">حالة العاملة</td>
          <td style="border: 1px solid #000; padding: 3px; width: 50%;">سبب الاسترداد</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 5px; vertical-align: top;">
            <div style="margin-bottom: 2px;"><span style="border: 1px solid #000; display: inline-block; width: 10px; height: 10px; margin-left: 6px;"></span> تحت الاجراء</div>
            <div style="margin-bottom: 2px;"><span style="border: 1px solid #000; display: inline-block; width: 10px; height: 10px; margin-left: 6px;"></span> سافرت</div>
            <div style="margin-bottom: 2px;"><span style="border: 1px solid #000; display: inline-block; width: 10px; height: 10px; margin-left: 6px;"></span> لديها تذكرة</div>
            <div><span style="border: 1px solid #000; display: inline-block; width: 10px; height: 10px; margin-left: 6px;"></span> سبب آخر: ________________</div>
          </td>
          <td style="border: 1px solid #000; padding: 5px; vertical-align: top;">
            <div style="margin-bottom: 2px;"><span style="border: 1px solid #000; display: inline-block; width: 10px; height: 10px; margin-left: 6px;"></span> عدم اللياقة الطبية</div>
            <div style="margin-bottom: 2px;"><span style="border: 1px solid #000; display: inline-block; width: 10px; height: 10px; margin-left: 6px;"></span> رفض العمل</div>
            <div style="margin-bottom: 2px;"><span style="border: 1px solid #000; display: inline-block; width: 10px; height: 10px; margin-left: 6px;"></span> هروب</div>
            <div><span style="border: 1px solid #000; display: inline-block; width: 10px; height: 10px; margin-left: 6px;"></span> سبب آخر: ________________</div>
          </td>
        </tr>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 11px;">
        <tr style="background: #f2f2f2; font-weight: bold; text-align: center;">
          <td style="border: 1px solid #000; padding: 3px; width: 50%;">المديونية</td>
          <td style="border: 1px solid #000; padding: 3px; width: 50%;">اسم المكتب الخارجي</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 5px; vertical-align: top;">
            <div style="margin-bottom: 2px;"><span style="border: 1px solid #000; display: inline-block; width: 10px; height: 10px; margin-left: 6px;"></span> داخل الضمان (مديونية على الوكيل)</div>
            <div><span style="border: 1px solid #000; display: inline-block; width: 10px; height: 10px; margin-left: 6px;"></span> خارج الضمان (اعتماد الإدارة)</div>
          </td>
          <td style="border: 1px solid #000; padding: 5px; text-align: center; vertical-align: middle;">
            {external_office_name}
          </td>
        </tr>
      </table>

      <div style="border: 1px solid #000; padding: 5px; background: #f2f2f2; font-size: 10.5px; text-align: center; margin-bottom: 5px;">
        <div style="font-weight: bold; margin-bottom: 1px;">(المعادلة)</div>
        (إجمالي تكلفة الاستقدام ÷ مدة عقد عمل العامل المنزلي بالأيام 730 يوم) × المدة المتبقية من مدة عقد عمل العامل المنزلي بالأيام.
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 11px; text-align: center;">
        <tr style="background: #f2f2f2; font-weight: bold;">
          <td style="border: 1px solid #000; padding: 3px; width: 50%;">قيمة المبلغ المسترد</td>
          <td style="border: 1px solid #000; padding: 3px; width: 50%;">قيمة التعاقد</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">{refund_amount}</td>
          <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">{contract_amount}</td>
        </tr>
      </table>

      <div style="border: 1px solid #000; padding: 5px; font-size: 11px; min-height: 40px; margin-bottom: 10px;">
        <strong>ملاحظات:</strong> {notes}
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px; padding: 0 40px;">
        <div style="text-align: center;">
          <p style="font-weight: bold; margin-bottom: 2px;">المحاسب</p>
          <p style="margin-bottom: 1px;">عبدالرحمن الاحمدي</p>
          <p>..........................</p>
        </div>
        <div style="text-align: center;">
          <p style="font-weight: bold; margin-bottom: 2px;">المدير المالي</p>
          <p style="margin-bottom: 1px;">عصـام السيد</p>
          <p>..........................</p>
        </div>
      </div>
    `)
  }
];

// تم تحديث المسار ليقوم بالحفظ في المجلد الجديد lib/templates
fs.writeFileSync('lib/templates/default_templates.json', JSON.stringify(templates, null, 2), 'utf8');
console.log('Successfully updated lib/templates/default_templates.json');
