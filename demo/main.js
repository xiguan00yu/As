import jsx from "@link-hooks/jsx";
import As from "../dist/as";

// jsx.h => as.h
jsx.h = ({ p: { key, ref, ...lp }, ...o }) => ({ ...o, k: key, r: ref, p: lp })


console.log(
  jsx`
    <div a=1 b=2>
    Hello  <strong> ${'world!'}</strong>
    </div>
  `
)

As.r(
  jsx`
    <div a=1 b=2>
    Hello <strong> ${'world!'}</strong>
    </div>
  `,
  document.getElementById('app')
)