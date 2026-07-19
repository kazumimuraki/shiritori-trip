export type CardType = 'normal' | 'lucky' | 'warp' | 'nullify'

export interface Card {
  id: number
  type: CardType
  title: string
  description: string
  count: number
}

export const CARDS: Card[] = [
  { id: 1,  type: 'normal', title: 'その駅で一番古そうなお店へ', description: 'その駅周辺で一番古そうなお店を見つけて、何か食べる', count: 1 },
  { id: 2,  type: 'normal', title: '絶景スポットを探せ', description: 'その駅周辺で一番綺麗だと思う景色を探して写真を撮る', count: 1 },
  { id: 3,  type: 'normal', title: '喫茶店の看板メニュー', description: '個人経営のカフェ・喫茶店に入って看板メニューを頼む', count: 1 },
  { id: 4,  type: 'normal', title: '展示施設に行け', description: '博物館・美術館・科学館・展示館など、なんらかの展示がある場所に行く', count: 1 },
  { id: 5,  type: 'normal', title: '食べ歩き1000円', description: '食べ歩きをする（1000円以上使うこと）', count: 1 },
  { id: 6,  type: 'normal', title: 'ラーメンを食え', description: 'ラーメン屋に入る', count: 1 },
  { id: 7,  type: 'normal', title: '駅員に聞け', description: '駅員さんに「この辺のおすすめスポット」を聞く', count: 1 },
  { id: 8,  type: 'normal', title: 'プリンを食え', description: 'プリンを食べる', count: 1 },
  { id: 9,  type: 'normal', title: '水の流れを撮れ', description: '水が流れている様子を撮影する', count: 1 },
  { id: 10, type: 'normal', title: 'ソフトクリームを食え', description: 'ソフトクリームを食べる', count: 1 },
  { id: 11, type: 'normal', title: '銭湯に入れ', description: '銭湯を見つけて入る（30分以内）', count: 1 },
  { id: 12, type: 'normal', title: '地元スーパーの惣菜', description: '地元のスーパーの惣菜コーナーで一番美味しそうなものを買って食べる', count: 1 },
  { id: 13, type: 'normal', title: 'おみくじを引け', description: '神社またはお寺でおみくじを引く', count: 1 },
  { id: 14, type: 'normal', title: '10m以上登れ', description: '地面から10m以上の高いところに登る', count: 1 },
  { id: 15, type: 'normal', title: 'ゲーセンで1プレイ', description: 'ゲームセンターで1ゲームやる', count: 1 },
  { id: 16, type: 'normal', title: '地元パン屋へ', description: '地元のパン屋でその場で何か食べる', count: 1 },
  { id: 17, type: 'normal', title: '花を探せ', description: '花を見つけて撮影する', count: 1 },
  { id: 18, type: 'normal', title: '本屋で一冊買え', description: '書店に入って本を1冊買う', count: 1 },
  { id: 19, type: 'normal', title: 'カラオケ1曲', description: 'カラオケに入って1曲歌う', count: 1 },
  { id: 20, type: 'normal', title: '公園の遊具に乗れ', description: '公園の遊具（ブランコ・滑り台など）に乗る', count: 1 },
  { id: 21, type: 'normal', title: 'シェアサイクルで10分', description: 'LuupまたはシェアサイクルのPORTを借りて10分街を駆け抜ける（ポートがない場合は近くのポートがある駅まで移動してやる・ポートリサーチはスマホ使用可）', count: 1 },
  { id: 22, type: 'normal', title: 'たこ焼きを食え', description: 'たこ焼きを食べる', count: 1 },
  { id: 23, type: 'normal', title: 'クレープを食え', description: 'クレープを食べる', count: 1 },
  { id: 24, type: 'normal', title: 'バッティングセンター', description: 'バッティングセンターで1回打つ（近くになければある駅まで移動してやる）', count: 1 },
  { id: 25, type: 'normal', title: '寿司を食え', description: '寿司を1000円以上食べる', count: 1 },
  { id: 26, type: 'lucky',   title: 'ラッキーカード', description: '残り時間が1時間延長！', count: 3 },
  { id: 27, type: 'warp',    title: '地方ワープカード', description: '地方ワープルーレットを回して、その地方に移動しなければならない！', count: 2 },
  { id: 28, type: 'nullify', title: '無力化カード', description: '手持ちに加えておける。通常ミッション無力化=1枚消費、地方ワープ/5の倍数ルール無力化=2枚消費', count: 4 },
]

export function buildDeck(): Card[] {
  return CARDS.flatMap(card => Array(card.count).fill(card))
}

export function drawCard(): Card {
  const deck = buildDeck()
  return deck[Math.floor(Math.random() * deck.length)]
}

export const REGIONS = ['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州']

export function spinWarp(currentRegion: string): string {
  const candidates = REGIONS.filter(r => r !== currentRegion)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function getCardColor(type: CardType): string {
  switch (type) {
    case 'lucky':   return 'text-yellow-400 border-yellow-400'
    case 'warp':    return 'text-purple-400 border-purple-400'
    case 'nullify': return 'text-blue-400 border-blue-400'
    default:        return 'text-white border-white'
  }
}

export function getCardBg(type: CardType): string {
  switch (type) {
    case 'lucky':   return 'bg-yellow-900'
    case 'warp':    return 'bg-purple-900'
    case 'nullify': return 'bg-blue-900'
    default:        return 'bg-zinc-900'
  }
}
