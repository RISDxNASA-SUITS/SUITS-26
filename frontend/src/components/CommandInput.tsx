import { type FormEvent, useState } from 'react'

type Props = {
  onSubmit: (text: string) => void
  disabled?: boolean
}

export function CommandInput({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const t = value.trim()
    if (!t || disabled) return
    onSubmit(t)
    setValue('')
  }

  return (
    <form className="command-form" onSubmit={handleSubmit}>
      <label htmlFor="eva-cmd" className="sr-only">
        EVA command
      </label>
      <input
        id="eva-cmd"
        type="text"
        autoComplete="off"
        placeholder="e.g. oxygen status, battery status, what phase am i in, help"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  )
}
