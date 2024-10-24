export interface IBlockItem {
    id: string;
    order: number;
    title: string;
    exams: string[];
    img: string;
    description: string;
    "description-kz": string;
}

export interface ITest {
    id?: string;
    title: string;
    "title-kz": string;
    pricePerTest: number;
    pricePerTestHigh: number;
    topics: ILaw[];
}
export interface ILaw {
    id: string;
    title: string;
    'title-kz': string;
    questions: IQuestion[];
    questionsCount: number;
    questionsTotal?: number;
    isSectionCompleted?: boolean;
}

export interface IQuestion {
    type: string;
    title: string;
    choices: string[];
    correctAnswer: string;
    selectedAnswer: string;
    tempSelectedAnswer?: string;
}
