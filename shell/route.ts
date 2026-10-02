export type ShellChoice = "classic" | "next";

export const shellFromSearch = (search: string): ShellChoice => {
  const query = search.startsWith("?") ? search.slice(1) : search;

  return new URLSearchParams(query).get("shell") === "next"
    ? "next"
    : "classic";
};

export const rewrittenShellPath = (
  pathname: string,
  search: string
): "/next" | undefined =>
  pathname === "/" && shellFromSearch(search) === "next" ? "/next" : undefined;

export const nextShellHref = (
  pathname: string,
  search: string
): string | undefined => {
  const path = rewrittenShellPath(pathname, search);

  return path ? `${path}${search}` : undefined;
};

// runs from the document, before daedalOS boots. static export cannot rewrite
// the request, so the query sends the browser to the other page.
export const nextShellBootScript =
  'if(location.pathname==="/"&&new URLSearchParams(location.search).get("shell")==="next"){location.replace("/next"+location.search)}';
