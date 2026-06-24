import type { JournalBlock } from '@/data/journal'

/** Renders the structured body of a Journal article as editorial prose. */
export default function JournalBody({ blocks }: { blocks: JournalBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2
                key={i}
                className="font-serif text-2xl md:text-3xl text-ivory pt-6 leading-tight"
              >
                {block.text}
              </h2>
            )
          case 'quote':
            return (
              <blockquote
                key={i}
                className="my-10 border-l-2 border-gold/50 pl-6 font-serif text-xl md:text-2xl text-gold-deep/90 italic leading-relaxed"
              >
                {block.text}
              </blockquote>
            )
          case 'list':
            return (
              <ul key={i} className="space-y-3 pl-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-ivory/70 text-base leading-relaxed">
                    <span className="text-gold mt-2 h-1 w-1 rounded-full bg-gold shrink-0" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )
          default:
            return (
              <p key={i} className="text-ivory/75 text-base md:text-lg leading-relaxed md:leading-loose">
                {block.text}
              </p>
            )
        }
      })}
    </div>
  )
}
