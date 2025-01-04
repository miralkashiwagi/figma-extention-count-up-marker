// 現在のマーカー設定
let currentNumber = 1; // 次に描画されるマーカー番号
let fillColor = { r: 1, g: 0, b: 0 }; // 赤色
let textColor = { r: 1, g: 1, b: 1 }; // 白色

// UIからのメッセージを受け取る
figma.ui.onmessage = async (msg) => {
  console.log("Received message:", msg); // デバッグ用

  if (msg.type === "update-settings") {
    // 設定更新
    currentNumber = msg.startingNumber;
    fillColor = msg.fillColor;
    textColor = msg.textColor;
  } else if (msg.type === "add-marker") {
    // 選択されている要素の取得
    const selection = figma.currentPage.selection;

    let x: number, y: number;

    if (selection.length > 0) {
      // 選択されている要素の上に配置
      const selectedNode = selection[0];
      const bounds = selectedNode.absoluteTransform;
      const width = selectedNode.width;
      const height = selectedNode.height;

      // 選択された要素の中央座標を計算
      x = bounds[0][2] + width / 2;
      y = bounds[1][2] + height / 2;
    } else {
      // 表示領域の中央に配置
      const viewport = figma.viewport.bounds;
      x = viewport.x + viewport.width / 2;
      y = viewport.y + viewport.height / 2;
    }

    // フォントをロード
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    // コンポーネントを作成（初回のみ）
    const component = createMarkerComponent();

    // インスタンスを配置
    const instance = component.createInstance();
    instance.x = x - 25; // 中心位置に調整
    instance.y = y - 25;

    // 数字を更新
    const textNode = instance.findOne(
      (node) => node.type === "TEXT"
    ) as TextNode;
    if (textNode) {
      textNode.characters = currentNumber.toString();
    }

    // 数字をカウントアップ
    currentNumber++;

    // ページに追加
    figma.currentPage.appendChild(instance);

    // 次の番号をUIに送信
    figma.ui.postMessage({
      type: "update-next-number",
      nextNumber: currentNumber,
    });
  }
};

// コンポーネント作成関数
function createMarkerComponent(): ComponentNode {
  const component = figma.createComponent();
  component.resize(50, 50); // フレームのサイズ
  component.name = "Marker Component";

  // オートレイアウト設定
  component.layoutMode = "VERTICAL";
  component.primaryAxisAlignItems = "CENTER";
  component.counterAxisAlignItems = "CENTER";
  component.layoutGrow = 0; // 自動拡大を無効化
  component.layoutAlign = "STRETCH"; // 子要素に合わせない
  component.primaryAxisSizingMode = "FIXED"; // 主軸（縦）のサイズを固定
  component.counterAxisSizingMode = "FIXED"; // 副軸（横）のサイズを固定
  component.fills = [{ type: "SOLID", color: fillColor }];
  component.cornerRadius = 25; // 円形

  // テキストノードを追加
  const text = figma.createText();
  text.fontSize = 32;
  text.characters = "0"; // 初期値
  text.fills = [{ type: "SOLID", color: textColor }];

  // フレームにテキストを追加
  component.appendChild(text);

  return component;
}

// プラグイン開始時にUIを表示
figma.showUI(__html__, { width: 300, height: 200 });
