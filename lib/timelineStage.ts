/**
 * شكل مرحلة التايم لاين المخزّن داخل CustomTimeline.stages (JSON).
 * لا يلزم تعديل عمود MySQL — الحقل stages يدعم JSON بالفعل.
 */

export type StageInteractionType = 'none' | 'file' | 'question';

/** radio = اختيار واحد؛ options = قائمة خيارات (سلكت) */
export type StageAnswerType = 'radio' | 'options';

export interface TimelineStage {
  label: string;
  field: string;
  order: number;
  icon?: string;
  /** إظهار المرحلة في واجهة المكاتب الخارجية. الافتراضي عند الغياب: true */
  visibleOnExternalOffice?: boolean;
  /** نوع التفاعل: عادي، رفع ملف، أو سؤال بخيارات */
  interactionType?: StageInteractionType;
  questionText?: string;
  answerType?: StageAnswerType;
  answerOptions?: string[];
}

export function parseAnswerOptionsText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** للواجهات: المرئي للخارجي = true إذا لم يُحدد (سلوك قديم) */
export function isStageVisibleOnExternalOffice(stage: TimelineStage): boolean {
  return stage.visibleOnExternalOffice !== false;
}

export interface StageFormState {
  label: string;
  field: string;
  icon: string;
  visibleOnExternalOffice: boolean;
  interactionType: StageInteractionType;
  questionText: string;
  answerType: StageAnswerType;
  answerOptionsText: string;
}

export function emptyStageForm(): StageFormState {
  return {
    label: '',
    field: '',
    icon: 'CheckCircle',
    visibleOnExternalOffice: true,
    interactionType: 'none',
    questionText: '',
    answerType: 'radio',
    answerOptionsText: '',
  };
}

export function stageToForm(stage: TimelineStage): StageFormState {
  return {
    label: stage.label,
    field: stage.field,
    icon: stage.icon || 'CheckCircle',
    visibleOnExternalOffice: stage.visibleOnExternalOffice !== false,
    interactionType: stage.interactionType || 'none',
    questionText: stage.questionText || '',
    answerType: stage.answerType || 'radio',
    answerOptionsText: (stage.answerOptions || []).join('\n'),
  };
}

/** رسالة خطأ عربية أو null إذا الصالح */
export function validateStageForm(form: StageFormState): string | null {
  if (form.interactionType === 'question') {
    if (!form.questionText.trim()) {
      return 'أدخل نص السؤال عند اختيار نوع «سؤال بخيارات».';
    }
    const opts = parseAnswerOptionsText(form.answerOptionsText);
    if (opts.length < 2) {
      return 'أدخل خيارين على الأقل (سطر لكل خيار).';
    }
  }
  return null;
}

/** يبني كائن مرحلة كاملاً للتخزين في JSON */
export function buildTimelineStageFromForm(form: StageFormState, order: number): TimelineStage {
  const base: TimelineStage = {
    label: form.label.trim(),
    field: form.field.trim(),
    order,
    icon: form.icon || 'CheckCircle',
    visibleOnExternalOffice: form.visibleOnExternalOffice,
  };
  if (form.interactionType === 'question') {
    return {
      ...base,
      interactionType: 'question',
      questionText: form.questionText.trim(),
      answerType: form.answerType,
      answerOptions: parseAnswerOptionsText(form.answerOptionsText),
    };
  }
  if (form.interactionType === 'file') {
    return { ...base, interactionType: 'file' };
  }
  return { ...base, interactionType: 'none' };
}
