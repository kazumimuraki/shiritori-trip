// 山手線30駅
const yamanote = [
  "品川","高輪ゲートウェイ","田町","浜松町","新橋","有楽町","東京","神田","秋葉原","御徒町",
  "上野","鶯谷","日暮里","西日暮里","田端","駒込","巣鴨","大塚","池袋","目白",
  "高田馬場","新大久保","新宿","代々木","原宿","渋谷","恵比寿","目黒","五反田","大崎"
]

// 京浜東北線（23区内・山手線重複除く）7駅
const keihintohoku = ["大井町","大森","蒲田","東十条","王子","上中里","赤羽"]

// 中央線快速（23区内・重複除く）7駅
const chuoLine = ["御茶ノ水","四ツ谷","中野","高円寺","阿佐ケ谷","荻窪","西荻窪"]

// 合計44駅
export const ALL_STATIONS = [...yamanote, ...keihintohoku, ...chuoLine]

export function getRandomStation(): string {
  return ALL_STATIONS[Math.floor(Math.random() * ALL_STATIONS.length)]
}
