import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "../../../_shared/path"
import { formatYmd, getNoteDates, readingMinutes } from "../../../_shared/noteMeta"
import style from "./styles/noteSpecs.scss"
import { isFolderMirrorTag, isRealNote } from "../../../_shared/notes"
// @ts-expect-error - Inline script loaded as text by esbuild plugin
import readersScript from "./scripts/specsReaders.inline.ts"
// @ts-expect-error - Inline script loaded as text by esbuild plugin
import backlinkPaths from "./scripts/backlinkPaths.inline.ts"

export interface NoteSpecsOptions {
  labels: { published: string; updated: string; runtime: string }
}

const defaultOptions: NoteSpecsOptions = {
  labels: { published: "Published", updated: "Updated", runtime: "min read" },
}

/**
 * 제목 아래 메타 한 줄 — 발행·개정일 · 읽는 시간 · 조회수 · 개념 태그(폴더 미러 태그 제외).
 * Published = created, Updated = posted(다를 때만). 주의: modified는 사소한 수정에도 바뀌어 쓰지 않는다. 구분자 `·`는 CSS가 단다.
 */
export default ((userOpts?: Partial<NoteSpecsOptions>) => {
  const opts = { labels: { ...defaultOptions.labels, ...userOpts?.labels } }

  const NoteSpecs: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const slug = fileData.slug
    if (!slug || !isRealNote(slug)) return <></>

    const { created, revised } = getNoteDates(fileData)
    const minutes = readingMinutes(fileData.text as string | undefined)
    const tags = ((fileData.frontmatter?.tags ?? []) as string[]).filter((tag) => !isFolderMirrorTag(slug, tag))

    if (!created && !minutes && tags.length === 0) return <></>

    const dates: [string, Date | undefined][] = [
      [opts.labels.published, created],
      [opts.labels.updated, revised],
    ]

    return (
      <p class="note-specs">
        {dates.map(
          ([label, date]) =>
            date && (
              <span>
                {label} <time datetime={date.toISOString()}>{formatYmd(date)}</time>
              </span>
            ),
        )}
        {minutes > 0 && (
          <span>
            {minutes} {opts.labels.runtime}
          </span>
        )}
        <span class="note-specs-readers">
          <span class="note-specs-readers-count">&nbsp;</span>
        </span>
        {tags.length > 0 && (
          <span class="note-specs-tags">
            {tags.map((tag) => (
              <a key={tag} href={resolveRelative(slug, `tags/${tag}`)}>
                #{tag}
              </a>
            ))}
          </span>
        )}
      </p>
    )
  }

  NoteSpecs.css = style
  NoteSpecs.beforeDOMLoaded = readersScript
  // 글 끝 Backlinks(업스트림) 폴더 경로도 여기 싣는다 — 노트 메타 플러그인이 모든 폭에 실린다.
  NoteSpecs.afterDOMLoaded = backlinkPaths
  return NoteSpecs
}) satisfies QuartzComponentConstructor<Partial<NoteSpecsOptions>>
