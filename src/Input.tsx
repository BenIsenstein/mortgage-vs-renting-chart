import { MergeStateFunction } from "useMergeState"

export function Input<T extends { [key: string]: unknown }>({
    state,
    mergeState,
    prop
}: {
    state: T,
    mergeState: MergeStateFunction<T>,
    prop: keyof T
}) {
    const isCheckbox = prop === 'HAS_MORTGAGE_INSURANCE'
  
    const props: React.InputHTMLAttributes<HTMLInputElement> = {
      type: isCheckbox ? 'checkbox' : undefined,
      [isCheckbox ? 'checked' : 'value']: state[prop]
    }
  
    return (
      <div>
        <label className="" htmlFor={prop as string}>{(prop as string).split('_').map(str => str[0] + str.toLowerCase().slice(1)).join(' ')}</label>
        <br />
        <input
          {...props}
          id={prop as string}
          /* @ts-expect-error no need to control mergeState types further */
          onChange={(e) => mergeState({ [prop]: isCheckbox ? !state[prop] : Number(e.target.value) })}
          className="border-1 border-black rounded-sm pl-2"
        />
      </div>
    )
}