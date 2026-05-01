// BilingualExplanation.tsx
// Shared helper — renders explanation text split by \n into two lines
export default function BilingualExplanation({ text }: { text: string }) {
  const parts = text.split('\n');
  return (
    <div className="flex flex-col gap-1">
      {parts.map((part, i) => (
        <p key={i} className={`text-xs leading-relaxed ${i === 1 ? 'text-zinc-500' : 'text-zinc-300'}`}>
          {part}
        </p>
      ))}
    </div>
  );
}