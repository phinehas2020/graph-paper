export function createDiagnostic(diagnostic) {
    return diagnostic;
}
export function sortDiagnostics(diagnostics) {
    const priority = {
        error: 0,
        warning: 1,
        info: 2,
    };
    return [...diagnostics].sort((left, right) => priority[left.level] - priority[right.level] || left.message.localeCompare(right.message));
}
