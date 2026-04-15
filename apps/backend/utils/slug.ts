import slug from 'slug';

export function buildSuggestions(base: string) {
    const suffixes = ["care", "health", "services", "group", "uk"];
    
    const b = generateSlug(base);
    return [
        `${b}-${suffixes[0]}`,
        `${b}-${suffixes[1]}`,
        `${b}-${suffixes[2]}`,
        `${b}-${suffixes[3]}`,
        `${b}-${suffixes[4]}`,
    ];
}

export function generateSlug(name: string): string {
    return slug(name, { lower: true });
}