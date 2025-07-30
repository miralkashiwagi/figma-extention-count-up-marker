"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let currentNumber = 1; // 次に描画されるマーカー番号
let selectedSize = "lg"; // デフォルトのサイズ
// コンポーネント名を定義
const MARKER_COMPONENT_NAME = "_count-up-marker";
// UIからのメッセージを受け取る
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (msg.type === "add-marker") {
            // UIから設定値を取得
            currentNumber = msg.startingNumber;
            selectedSize = msg.size;
            const selection = figma.currentPage.selection;
            let x, y;
            // 最初に親要素の変数を宣言（グローバルスコープで利用可能に）
            let targetParent = figma.currentPage;
            if (selection.length > 0) {
                const selectedNode = selection[0];
                // 親要素を取得
                const parentNode = selectedNode.parent;
                // 選択されたノードの絶対座標での中心位置を計算
                const selectedBounds = selectedNode.absoluteTransform;
                const width = selectedNode.width;
                const height = selectedNode.height;
                const absoluteX = selectedBounds[0][2] + width / 2;
                const absoluteY = selectedBounds[1][2] + height / 2;
                // 親要素がフレーム、グループ、セクションのいずれかであることを確認
                if (parentNode && (parentNode.type === 'FRAME' || parentNode.type === 'GROUP' || parentNode.type === 'SECTION')) {
                    targetParent = parentNode;
                    // 親要素が適切なタイプであることを確認
                    if ('absoluteTransform' in parentNode) {
                        try {
                            // 親の変換行列を取得
                            const parentTransform = parentNode.absoluteTransform;
                            // 親の種類に応じた座標変換
                            if (parentNode.type === 'GROUP') {
                                // グループ特有の処理
                                // 選択されたノードの「ローカル」座標（親要素内での相対位置）を取得
                                if ('relativeTransform' in selectedNode) {
                                    const relativeTransform = selectedNode.relativeTransform;
                                    // x, yの座標を直接取得
                                    x = relativeTransform[0][2] + width / 2;
                                    y = relativeTransform[1][2] + height / 2;
                                }
                                else {
                                    // フォールバック: 親の左上からのオフセットを計算
                                    const parentX = parentTransform[0][2];
                                    const parentY = parentTransform[1][2];
                                    x = absoluteX - parentX;
                                    y = absoluteY - parentY;
                                }
                            }
                            else {
                                // フレームやセクションの場合は単純なオフセット計算
                                const parentX = parentTransform[0][2];
                                const parentY = parentTransform[1][2];
                                x = absoluteX - parentX;
                                y = absoluteY - parentY;
                            }
                        }
                        catch (e) {
                            // 親要素の座標変換に失敗した場合はオフセットのみで計算
                            const parentX = parentNode.x;
                            const parentY = parentNode.y;
                            x = absoluteX - parentX;
                            y = absoluteY - parentY;
                        }
                    }
                    else {
                        // 親要素が適切な変換行列を持っていない場合
                        x = absoluteX;
                        y = absoluteY;
                    }
                }
                else {
                    // ページに直接配置する場合は絶対座標をそのまま使用
                    x = absoluteX;
                    y = absoluteY;
                }
            }
            else {
                const viewport = figma.viewport.bounds;
                x = viewport.x + viewport.width / 2;
                y = viewport.y + viewport.height / 2;
            }
            // フォントをロード
            yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
            yield figma.loadFontAsync({ family: "Inter", style: "Bold" });
            // ドキュメント全体からコンポーネントセットを取得または作成
            const markerComponentSet = yield getOrCreateMarkerComponentSet();
            // 選択されたバリアントのインスタンスを取得
            const variant = markerComponentSet.findChild((child) => child.name === `Size=${selectedSize}`);
            // if (!variant) {
            //   console.error("Variant not found. Available variants:", markerComponentSet.children.map((child) => child.name));
            //   throw new Error(`Variant for size "${selectedSize}" not found.`);
            // }
            const instance = variant.createInstance();
            // インスタンスの寸法を取得（中心に配置するため）
            const instanceWidth = instance.width;
            const instanceHeight = instance.height;
            // 中心からわずかにオフセットした位置に配置
            const offsetX = -10; // 左方向に少しオフセット
            const offsetY = -10; // 上方向に少しオフセット
            // オフセットも含めた最終的な位置を計算
            instance.x = Math.round(x - instanceWidth / 2) + offsetX;
            instance.y = Math.round(y - instanceHeight / 2) + offsetY;
            // 数字を更新
            const textNode = instance.findOne((node) => node.type === "TEXT");
            if (textNode) {
                textNode.characters = currentNumber.toString();
            }
            // 数字をカウントアップ
            currentNumber++;
            // 親要素に追加
            if (targetParent && targetParent !== figma.currentPage) {
                // targetParentがSceneNodeであることを確認
                if ('appendChild' in targetParent) {
                    targetParent.appendChild(instance);
                }
                else {
                    figma.currentPage.appendChild(instance);
                }
            }
            else {
                // 適切な親要素がない場合や選択がない場合は現在のページに追加
                figma.currentPage.appendChild(instance);
            }
            // インスタンスを選択状態にする
            figma.currentPage.selection = [instance];
            // 次の番号をUIに送信
            figma.ui.postMessage({ type: "update-next-number", nextNumber: currentNumber });
        }
    }
    catch (error) {
        // エラーが発生した場合は何もしない
    }
});
// ドキュメント全体からコンポーネントセットを取得または作成
function getOrCreateMarkerComponentSet() {
    return __awaiter(this, void 0, void 0, function* () {
        yield figma.loadAllPagesAsync();
        // 既存のコンポーネントセットを検索
        const existingSet = figma.root.findOne((node) => node.type === "COMPONENT_SET" && node.name === MARKER_COMPONENT_NAME);
        if (existingSet) {
            return existingSet;
        }
        // バリアントを作成
        const sizes = { lg: 48, md: 32, sm: 24 };
        const components = [];
        for (const size in sizes) {
            const dimension = sizes[size]; // 型アサーション
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
            component.strokes = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }];
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
        return variantSet;
    });
}
// プラグイン開始時にUIを表示
figma.showUI(__html__, { width: 280, height: 200 });
