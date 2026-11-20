import { h } from "preact"
import type { QuartzTransformerPlugin } from "@quartz-community/types"

/**
 * GoatCounter 트래킹 스크립트를 `<head>`에 주입한다.
 *
 * - native provider 대신 head 리소스로 넣는다(`analytics:`는 비워 둔다)
 * - home-hero 메타 줄이 읽는 방문 수의 출처다. 함께 유지할 것
 * - `headMeta`로 검색엔진 소유 확인 `<meta>`도 같은 자리에 주입한다
 */

// SPA 이동은 문서를 다시 로드하지 않아 count.js가 세지 못한다 — nav마다 직접 센다. 첫 nav는 count.js 자동 집계와 겹쳐 건너뛴다.
// 주의: SPA가 head를 갈아 끼우지만 DOMParser로 만든 script는 재실행되지 않아 리스너는 첫 로드에 한 번만 붙는다.
const NAV_COUNT = `let gcFirstNav=true;document.addEventListener("nav",()=>{if(gcFirstNav){gcFirstNav=false;return}window.goatcounter?.count?.({path:location.pathname})})`

export interface GoatcounterTrackingOptions {
  /** GoatCounter site subdomain, e.g. "haejunhyun" for haejunhyun.goatcounter.com */
  site: string
  /** URL of the GoatCounter counter script */
  scriptSrc: string
  /** `<head>`에 넣을 `<meta name content>` 목록(검색엔진 소유 확인용) */
  headMeta: { name: string; content: string }[]
}

const defaultOptions: GoatcounterTrackingOptions = {
  site: "haejunhyun",
  scriptSrc: "//gc.zgo.at/count.js",
  headMeta: [],
}

const GoatcounterTracking: QuartzTransformerPlugin<Partial<GoatcounterTrackingOptions>> = (
  userOpts,
) => {
  const opts: GoatcounterTrackingOptions = { ...defaultOptions, ...userOpts }

  return {
    name: "GoatcounterTracking",
    // 주의: no-op이지만 지우면 안 된다 — Quartz의 transformer 검증이
    // textTransform/markdownPlugins/htmlPlugins 중 하나를 요구한다.
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {
        additionalHead: [
          h("script", { dangerouslySetInnerHTML: { __html: NAV_COUNT } }),
          h("script", {
            "data-goatcounter": `https://${opts.site}.goatcounter.com/count`,
            async: true,
            src: opts.scriptSrc,
          }),
          ...opts.headMeta.map((m) => h("meta", { name: m.name, content: m.content })),
        ],
      }
    },
  }
}

export default GoatcounterTracking
