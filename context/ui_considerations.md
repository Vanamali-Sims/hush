Here's what the research says, organized by what seems to help most:

## Dyslexia — font and text formatting have the clearest evidence

The most rigorous work here is Luz Rello and Ricardo Baeza-Yates's eye-tracking studies (ACM). Testing 48 dyslexic readers across 12 fonts, they found sans serif, monospaced, and roman font styles significantly improved reading performance over serif, proportional, and italic fonts. Specific fonts that performed well included Helvetica, Courier, Arial, Verdana, and Computer Modern Unicode.

Interestingly, "dyslexia-friendly" fonts like OpenDyslexic didn't hold up as well as assumed — the original study and a later replication with elementary students both found no improvement in reading rate or accuracy, and no participants preferred it for reading material. So the win isn't a special font — it's *avoiding* serif/italic/proportional styling.

Beyond font choice, follow-up work from the same group found larger text and character spacing helped: larger text and larger character spacings led participants, both with and without dyslexia, to read significantly faster, and a separate study landed on 18-point font as a good baseline size for dyslexic-friendly web text.

## Autism — predictability and reducing sensory/cognitive load

A 2020 eye-movement study on mobile UIs found something specific and actionable: autistic users process icons and images faster than text, and mismatched icon/text pairings caused confusion — the fix being to keep icon and label meaning tightly aligned rather than using clever or abstract icons.

Broader literature reviews converge on a few structural principles:
- **Predictability & consistency**: navigation and layout should be predictable across a site, with the same actions on similar elements producing consistent results
- **Minimized sensory stimuli**: predictability, clarity, and minimized sensory stimuli are crucial for daily comfort, and mobile apps in particular were found to cause significant cognitive overload for autistic users compared to neurotypicals, requiring more effort and time to complete tasks
- **Simplified navigation**: a synthesis of multiple studies recommends simplifying and limiting navigation to one toolbar, labeling every page clearly, and showing progress bars for multi-step journeys, plus large buttons combining both icon and text

A more formal usability framework (built for autism-focused evaluation) breaks this into testable categories: system status visibility (clear feedback on task progress, errors, and state changes), recognition and predictability (interface elements whose function is obvious without deep investigation), navigability (avoiding link/information overload), and response to actions (never leaving an action without feedback, since incomplete feedback is especially hard for autistic users to recover from).

## ADHD — the research is thinner on UI-specific studies, but the underlying cognitive science is solid

There isn't as much peer-reviewed HCI literature testing ADHD-specific interfaces directly (a CHI 2022 paper actually critiques the field for this — reviewing ADHD-and-technology research through the lens of neurodivergent readers themselves, questioning how much existing work reflects real lived experience versus deficit-framed assumptions).

What we do know from cognitive/clinical research: ADHD is linked to working memory and task-switching differences under distraction — for instance, adults with ADHD showed altered neural filtering of distractors during working-memory tasks even when raw behavioral performance looked similar to controls. That maps onto practical design choices:
- **Progressive disclosure** (revealing only what's needed for the current step) and **persistent state** (not losing a user's place) — patterns that reduce reliance on working memory
- **Breaking multi-step flows into single-task screens** rather than long forms
- **Avoiding infinite scroll and unbounded feeds**, which exploit rather than support attention regulation
- **Forgiving error recovery** (easy undo, clear correction paths) — since slips are more likely when attention is taxed, and punishing UI makes it a "user error" problem instead of a design problem

## Cross-cutting findings that show up across conditions

A few things weren't specific to one diagnosis and kept recurring across the literature:

1. **User control/customization** — letting people adjust font size, contrast, color scheme, and motion rather than imposing one design for everyone
2. **Consistency and reduced ambiguity** — this helps autistic *and* ADHD users, just for different underlying reasons (predictability vs. reduced decision load)
3. **Testing with neurodivergent participants directly**, not just applying WCAG heuristics — several papers explicitly note that standard accessibility guidelines cover sensory/motor accessibility well but under-address cognitive accessibility
4. **Reducing motion and abrupt changes** — relevant both for sensory sensitivity (autism) and for minimizing distraction (ADHD)

One honest caveat: a lot of the more actionable, specific guidance (fonts, spacing) comes from dyslexia research, which has the most controlled experimental studies. Autism guidance is well-supported but often qualitative/heuristic. ADHD-specific *interface* research is the least mature of the three — most of the design advice there is extrapolated from broader cognitive/clinical findings rather than tested directly on interfaces.

Want me to pull the actual PDFs of any of these (e.g., the Rello & Baeza-Yates font paper, or the autism eye-tracking study) so you can dig into methodology?


Good follow-up — there's actually solid research on both, though color findings are messier than font findings.

## Colors

**Dyslexia:** This is the most experimentally studied area. Luz Rello's team tested 10 background colors with black text across 66+ dyslexic readers and found warm, low-contrast pairings performed best, consistent with earlier work showing black text on a cream background produced the shortest eye-fixation durations — the readable pair. A separate physiological study (EEG + eye tracking on children) found turquoise background, turquoise overlay, and yellow background were the fastest conditions for dyslexic readers. The British Dyslexia Association's standing guidance lines up with this: dark (not pure black) text on a light (not pure white) background, avoiding pure white because it can read as "too dazzling."

Worth flagging honestly: this isn't settled science. A UCL-linked study specifically testing yellow backgrounds found no reading-speed benefit over white for dyslexic readers, and a 2014 meta-analysis concluded evidence for colored overlays/backgrounds is highly mixed and of poor quality despite continued use in schools and tools like Microsoft's Immersive Reader. There's also a real tension with WCAG: WCAG pushes toward high contrast (4.5:1 minimum), while dyslexia researchers found people read faster with lower contrast than controls — just still above the WCAG floor. Practical takeaway: cream/warm/low-glare backgrounds are a safe default, but treat it as a user-toggleable preference, not a mandate — individual response varies a lot.

**Autism:** Less experimental, more observational/environmental research (mostly built-environment studies, but the findings transfer reasonably well to screens). A case study on autistic children found dull, pastel colors and muted lighting were rated more suitable than intense light or glare. Consistent pattern across multiple reviews: muted and pastel palettes under soft lighting were experienced as more calming for visually sensitive autistic participants, while bright, saturated color was more stimulating. One interior-design-focused study found a more specific breakdown: neutral colors like grey, green, blue, and white were generally preferred, while bright red and yellow had adverse effects, and white used alone (not as a light backdrop) also had a negative effect. As with dyslexia, individual variation is emphasized throughout the literature — the honest summary is "avoid high-saturation/high-contrast combos by default, but make it adjustable."

## Layout

**Cross-cutting principle — reduce extraneous cognitive load:** A lot of the layout guidance traces back to well-established cognitive-psychology heuristics applied to UI: Hick's Law (more options increase decision time), Miller's Law (people can hold ~7 items in working memory, so chunk information into groups), and Gestalt grouping principles (proximity/similarity to reduce confusion) — plus straightforward use of whitespace and progressive disclosure to cut visual clutter.

**Autism-specific:** The strongest recurring finding is *predictability over novelty* — simplifying and limiting navigation to a single toolbar, labeling every page clearly, and showing progress bars for any journey longer than one page, combined with layouts and navigation that behave the same way every time so the same action on similar elements always produces the same result. A more formal evaluation framework built for this population explicitly separates "navigability" (avoid link/information overload) from "recognition and predictability" (elements should telegraph their function without investigation) as distinct things to test for.

**ADHD-specific:** The pattern is consistent across sources: simplify layouts with clear hierarchies, ample white space, and logical grouping, avoiding clutter and simultaneous competing elements, paired with consistent structure across pages so users can predict where key actions live, and progressive disclosure — showing one step at a time with visible progress ("Step 2 of 4") rather than a full form at once. One practical pattern that shows up repeatedly: using visual weight deliberately (bold/badge the one urgent item, mute the rest) rather than presenting everything with equal visual emphasis, since equal-weight layouts force the user to do the prioritization work themselves.

**Dyslexia layout notes** (less about color, more structural): shorter line lengths, left-aligned (not justified) text, generous line spacing, and avoiding walls of unbroken text — these come out of the same Rello line of research on web text layout guidelines, alongside the font/spacing findings from before.

## Honest caveat

The dyslexia findings are the most rigorously tested (controlled experiments, eye-tracking). The autism findings are well-replicated but mostly observational/preference-based rather than randomized experiments. The ADHD layout guidance is the least directly tested on interfaces — it's largely extrapolated from general cognitive-load research rather than ADHD-specific UI studies. Across all three, "make it user-adjustable" beats "pick one universal palette/layout," since individual variation within each group is substantial.