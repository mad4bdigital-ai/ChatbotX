import { rescue, TiktokAPIException } from "../exception"
import {
  createTiktokBusinessClient,
  createTiktokClient,
} from "../lib/http-client"
import type {
  BusinessApiResponse,
  TiktokApiResponse,
  TiktokVideo,
  TiktokVideoListResult,
} from "../schema"

/**
 * Public video posts on the connected account, newest first, for the comment
 * automation post picker.
 *
 * Note the plural path segment (`videos`, not `video`) and that a post is keyed
 * by `item_id` here while every comment endpoint calls the same id `video_id`.
 *
 * `fields` is required in practice: TikTok returns only the fields asked for,
 * so an omitted list yields entries carrying nothing but `item_id`.
 */
export const listTiktokVideos = (
  accessToken: string,
  params: {
    businessId: string
    fields?: string[]
    cursor?: number
    maxCount?: number
    filters?: { video_ids: string[] }
  },
): Promise<TiktokVideoListResult> =>
  rescue("business/videos/list", async () => {
    const client = createTiktokBusinessClient(accessToken)
    const searchParams: Record<string, string> = {
      business_id: params.businessId,
      fields: JSON.stringify(
        params.fields ?? [
          "item_id",
          "caption",
          "thumbnail_url",
          "share_url",
          "create_time",
          "comments",
        ],
      ),
    }
    if (params.cursor !== undefined) {
      searchParams.cursor = `${params.cursor}`
    }
    if (params.maxCount !== undefined) {
      searchParams.max_count = `${params.maxCount}`
    }
    if (params.filters) {
      searchParams.filters = JSON.stringify(params.filters)
    }

    const response = await client.get<
      BusinessApiResponse<TiktokVideoListResult>
    >("business/videos/list/", { searchParams })

    if (response.code !== 0) {
      throw new TiktokAPIException(
        response.message ?? "business/videos/list failed",
      )
    }
    return response.data ?? {}
  })

/**
 * One owned video by id, or `null` when the account no longer has it.
 *
 * Behind the `video.list` scope. It is approved and requested, but a connection
 * made before the approval does not carry it until its owner re-authorizes, so
 * every caller must treat a rejection as "no details available" rather than an
 * error — a comment conversation has to stay usable without it. The id is
 * re-checked against `item_id` so a backend that ignores `filters` (the
 * parameter is undocumented on this endpoint) yields `null` rather than an
 * unrelated video's caption.
 */
export const findTiktokVideo = async (
  accessToken: string,
  params: { businessId: string; videoId: string },
): Promise<TiktokVideo | null> => {
  const result = await listTiktokVideos(accessToken, {
    businessId: params.businessId,
    filters: { video_ids: [params.videoId] },
    maxCount: 1,
  })
  return (
    result.videos?.find((video) => video.item_id === params.videoId) ?? null
  )
}

export type TiktokOwnedVideo = {
  id: string
  create_time: number
  title?: string
  cover_image_url?: string
  share_url?: string
  view_count?: number
  like_count?: number
  comment_count?: number
  share_count?: number
}

const CAMPOS = [
  "id",
  "create_time",
  "title",
  "cover_image_url",
  "share_url",
  "view_count",
  "like_count",
  "comment_count",
  "share_count",
].join(",")

/**
 * Los videos de la cuenta con sus contadores.
 *
 * Necesita el scope `video.list`. Es un POST, no un GET, y los campos viajan
 * en la query mientras el tamano de pagina va en el cuerpo — asi lo pide la
 * API de TikTok. El cliente no acepta `searchParams` en POST, de ahi que los
 * campos vayan pegados a la ruta.
 *
 * TikTok NO expone los guardados (favoritos) de un video: da vistas, me
 * gusta, comentarios y compartidos, y nada mas.
 */
export const listVideos = ({
  accessToken,
  maxCount = 20,
}: {
  accessToken: string
  maxCount?: number
}): Promise<TiktokOwnedVideo[]> =>
  rescue("video/list", async () => {
    const client = createTiktokClient(accessToken)
    const response = await client.post<
      TiktokApiResponse<{ videos: TiktokOwnedVideo[] }>
    >(`video/list/?fields=${CAMPOS}`, { json: { max_count: maxCount } })
    return response.data.videos ?? []
  })
