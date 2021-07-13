import jsx from "@link-hooks/jsx";
import As from "../dist/as";

// jsx.h => as.h
jsx.h = ({ p: { key, ref, ...lp }, ...o }) => ({ ...o, k: key, r: ref, p: lp })

const o = { c: 0 }

const Row = ({ c }) => {
  const [count, setCount] = As.us(1)

  As.ue(() => {
    console.log('ue')
  }, [count])
  
  const onClick = () => {
    setCount(c => c + 1)
  }
  
  return jsx`
    <div o=${o} onClick=${onClick}>
      Hello ${count} <strong> ${'world!'}</strong>
    </div>`
}

As.r(
  jsx`
    <${Row}>
      Hello <strong> ${'world!'}</strong>
    </${Row}>
  `,
  document.getElementById('app')
)