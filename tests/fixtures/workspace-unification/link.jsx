import React from "react";
// Link presentation is isolated from Next's router. Navigation certification is a separate test.
export default function Link({ children, href, prefetch: _prefetch, ...props }) { void _prefetch; return <a href={href} {...props}>{children}</a>; }
