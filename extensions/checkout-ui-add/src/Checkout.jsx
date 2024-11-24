import { useEffect, useState } from "react";
import {
  Banner,
  Image,
  useApi,
  useTranslate,
  reactExtension,
  useCartLines,
  useApplyCartLinesChange,
  useSettings,
  useStorage,
} from "@shopify/ui-extensions-react/checkout";
import {
  BlockSpacer,
  BlockStack,
  Checkbox,
  Divider,
  Heading,
  InlineLayout,
  Pressable,
  Text,
} from "@shopify/ui-extensions/checkout";

export default reactExtension(
  "purchase.checkout.cart-line-list.render-after",
  () => <Extension />
);

function Extension() {
  const translate = useTranslate();
  const { extension } = useApi();
  const { query } = useApi();
  const storage = useStorage();

  const [variantData, setVariantData] = useState(null);
  const [isSelected, setIsSelected] = useState(false);
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();

  const settings = useSettings();
  const variantId = settings.selected_variant;

  console.log("variantId", variantId);

  useEffect(() => {
    async function getVariant() {
      try {
        const queryResult = await query(
          `{
            node(id: "${variantId}") {
              ... on ProductVariant {
                title
                price {
                  amount
                  currencyCode
                }
                image {
                  url
                  altText
                }
                product {
                  title
                  featuredImage {
                    url
                    altText
                  }
                }  
              }
            }
          }`
        );

        if (queryResult.data) {
          setVariantData(queryResult.data.node);
        }
      } catch (error) {
        console.error("Error fetching variant data:", error);
      }
    }

    if (variantId) {
      getVariant();
    }
  }, [variantId]);

  useEffect(() => {
    async function fetchSavedSelection() {
      const savedSelection = await storage.read(`isSelected_${variantId}`);
      if (savedSelection !== null) {
        setIsSelected(savedSelection);
      }
    }

    if (variantId) {
      fetchSavedSelection();
    }
  }, [variantId]);

  useEffect(() => {
    async function updateCartLines() {
      const cartLine = cartLines.find(
        (cartLine) => cartLine.merchandise.id === variantId
      );

      if (isSelected) {
        if (!cartLine) {
          await applyCartLinesChange({
            type: "addCartLine",
            quantity: 1,
            merchandiseId: variantId,
          });
        }
      } else {
        if (cartLine) {
          await applyCartLinesChange({
            type: "removeCartLine",
            id: cartLine.id,
            quantity: cartLine.quantity,
          });
        }
      }
      await storage.write(`isSelected_${variantId}`, isSelected);
    }

    if (variantId) {
      updateCartLines();
    }
  }, [isSelected, cartLines]);

  if (!variantId || !variantData) return null;

  return (
    <>
      <Divider />
      <BlockSpacer />

      <BlockSpacer spacing="base" />
      <Heading level={2}>
        Pensez à vous faire installer votre climatiseur
      </Heading>
      <BlockSpacer />
      <Pressable
        onPress={() => {
          setIsSelected(!isSelected);
        }}
      >
        <InlineLayout
          blockAlignment="center"
          spacing={["base", "base"]}
          columns={["auto", 80, "fill"]}
          padding="base"
        >
          <Checkbox
            checked={isSelected}
            onChange={(value) => setIsSelected(value)}
          />
          <Image
            source={variantData.image?.url ? variantData.image.url : ""}
            alt={variantData.product.title}
            width="40px"
            border="base"
            borderRadius="base"
          />
          <BlockStack>
            <Text>{variantData.product.title}</Text>
            <Text>
              {variantData.price.amount}
              {variantData.price.currencyCode}
            </Text>
          </BlockStack>
        </InlineLayout>
      </Pressable>
    </>
  );
}
