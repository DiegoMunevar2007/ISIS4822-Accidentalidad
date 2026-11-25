import * as React from 'react'
import { Accordion as A } from 'radix-ui'
import { ChevronDown } from 'lucide-react'

export const Accordion = A.Root

export function AccordionItem({ title, children, value }: { title: string; children: React.ReactNode; value: string }) {
  return (
    <A.Item value={value} className="rounded-md border border-border bg-card px-3 py-1.5">
      <A.Header>
        <A.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-2 py-1 text-left text-[0.9375rem] font-semibold">
          {title}
          <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
        </A.Trigger>
      </A.Header>
      <A.Content className="pb-2 pt-1 text-[0.9375rem] text-ink-2">{children}</A.Content>
    </A.Item>
  )
}
