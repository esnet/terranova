export function resolvePath(object: any, path: string, defaultValue = null) {
    return path
        .split(/[\.\[\]\'\"]/)
        .filter((p) => p) // remove empty splits
        .reduce((o, p) => (o ? o[p] : defaultValue), object);
}

export function setPath(object: any, path: string, newValue: any) {
    let splitPath = path.split(/[\.\[\]\'\"]/).filter((p) => p);
    let o = object;
    let lastItem = splitPath.pop() as string;
    splitPath.forEach((p) => {
        o = o[p];
    });
    o[lastItem] = newValue;
}

export function quickhash(input: string) {
    return Array.from(input).reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0);
}
