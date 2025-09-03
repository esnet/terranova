export const text2clipboard = (text: string) => {
    navigator.clipboard.writeText(text.trim());
};
