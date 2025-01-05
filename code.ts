let currentNumber = 1; // 次に描画されるマーカー番号
let selectedSize = "lg"; // デフォルトのサイズ

// コンポーネント名を定義
const MARKER_COMPONENT_NAME = "_count-up-maker";

// UIからのメッセージを受け取る
figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "add-marker") {
      // UIから設定値を取得
      currentNumber = msg.startingNumber;
      selectedSize = msg.size;

      console.log("Received settings:", { currentNumber, selectedSize });

      const selection = figma.currentPage.selection;

      let x: number, y: number;

      if (selection.length > 0) {
        const selectedNode = selection[0];
        console.log("Selected node:", selectedNode);

        const bounds = selectedNode.absoluteTransform;
        const width = selectedNode.width;
        const height = selectedNode.height;

        x = bounds[0][2] + width / 2;
        y = bounds[1][2] + height / 2;
      } else {
        const viewport = figma.viewport.bounds;
        x = viewport.x + viewport.width / 2;
        y = viewport.y + viewport.height / 2;
      }

      // フォントをロード
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      await figma.loadFontAsync({ family: "Inter", style: "Bold" });

      // ドキュメント全体からコンポーネントセットを取得または作成
      const markerComponentSet = await getOrCreateMarkerComponentSet();

      // 選択されたバリアントのインスタンスを取得
      console.log("Available variants:", markerComponentSet.children.map((child) => child.name));
      const variant = markerComponentSet.findChild(
          // (child) => child.type === "COMPONENT" && child.variantProperties?.size === selectedSize
          (child) => child.name === `Size=${selectedSize}`
      ) as ComponentNode;

      console.log(variant);


      // if (!variant) {
      //   console.error("Variant not found. Available variants:", markerComponentSet.children.map((child) => child.name));
      //   throw new Error(`Variant for size "${selectedSize}" not found.`);
      // }

      const instance = variant.createInstance();
      instance.x = x - 25; // 中心位置に調整
      instance.y = y - 25;

      // 数字を更新
      const textNode = instance.findOne((node) => node.type === "TEXT") as TextNode;
      if (textNode) {
        textNode.characters = currentNumber.toString();
      }

      // 数字をカウントアップ
      currentNumber++;

      // ページに追加
      figma.currentPage.appendChild(instance);

      // インスタンスを選択状態にする
      figma.currentPage.selection = [instance];

      // 次の番号をUIに送信
      figma.ui.postMessage({ type: "update-next-number", nextNumber: currentNumber });

      console.log("Marker added successfully.");
    }
  } catch (error) {
    console.error("Error during add-marker:", error);
  }
};

// ドキュメント全体からコンポーネントセットを取得または作成
async function getOrCreateMarkerComponentSet(): Promise<ComponentSetNode> {
  await figma.loadAllPagesAsync();

  // 既存のコンポーネントセットを検索
  const existingSet = figma.root.findOne(
      (node) => node.type === "COMPONENT_SET" && node.name === MARKER_COMPONENT_NAME
  ) as ComponentSetNode | null;

  if (existingSet) {
    return existingSet;
  }

  console.log("Creating new marker component set.");

  // バリアントを作成
  const sizes = { lg: 48 , md: 32, sm: 24 };
  const components: ComponentNode[] = [];

  for (const size in sizes) {
    const dimension = sizes[size as keyof typeof sizes]; // 型アサーション
    const component = figma.createComponent();
    component.resize(dimension, dimension);
    component.name = `Size=${size}`; // バリアント名を設定


    // オートレイアウト設定
    component.layoutMode = "VERTICAL";
    component.primaryAxisAlignItems = "CENTER";
    component.counterAxisAlignItems = "CENTER";
    component.paddingTop = 0;
    component.paddingBottom = 0;
    component.paddingLeft = 0;
    component.paddingRight = 0;
    component.itemSpacing = 0;

    // 高さを固定する設定
    component.layoutGrow = 0; // 自動拡大を無効化
    // component.layoutAlign = "STRETCH"; // 子要素に合わせない
    component.primaryAxisSizingMode = "FIXED"; // 主軸（縦）のサイズを固定
    component.counterAxisSizingMode = "FIXED"; // 副軸（横）のサイズを固定

    // 塗りと角丸を設定
    component.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    component.strokes = [{type: "SOLID", color: { r: 1, g: 0, b: 0 } }];
    // component.strokeWeight = 2;
    component.strokeWeight = size === "sm" ? 1 : size === "md" ? 1.25 : 1.5;
    component.cornerRadius = dimension / 2;

    // テキストノードを追加
    const text = figma.createText();
    text.fontSize = dimension * 0.85;
    text.characters = "0";
    text.letterSpacing = { value: -8, unit: "PERCENT" };
    text.lineHeight = { value: 100, unit: "PERCENT" };
    text.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }];
    text.fontName = { family: "Inter", style: "Bold" };
    text.locked = true;
    component.appendChild(text);

    components.push(component);
  }

  const variantSet = figma.combineAsVariants(components, figma.currentPage);
  variantSet.name = MARKER_COMPONENT_NAME;


  // コンポーネントセット全体にオートレイアウトを適用
  variantSet.layoutMode = "VERTICAL";
  variantSet.primaryAxisAlignItems = "CENTER";
  variantSet.counterAxisAlignItems = "CENTER";
  variantSet.paddingTop = 0;
  variantSet.paddingBottom = 0;
  variantSet.paddingLeft = 0;
  variantSet.paddingRight = 0;
  variantSet.itemSpacing = 10; // バリアント間の間隔
  // variantSet.primaryAxisSizingMode = "AUTO"; // 主軸の高さをHugに設定
  // variantSet.counterAxisSizingMode = "AUTO"; // 副軸の幅をHugに設定

  console.log("Variant set created with variants:", components.map((c) => c.name)); // デバッグ用

  return variantSet;
}

// プラグイン開始時にUIを表示
figma.showUI(__html__, { width: 280, height: 200 });
