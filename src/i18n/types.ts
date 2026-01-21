export type Language = 'en-US' | 'pt-BR';

export interface Translation {
    [key: string]: string;
}

export type TranslationDictionary = Translation;
