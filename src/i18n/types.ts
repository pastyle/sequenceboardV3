export type Language = 'en-US' | 'pt-BR' | 'es-ES';

export interface Translation {
    [key: string]: string;
}

export type TranslationDictionary = Translation;
