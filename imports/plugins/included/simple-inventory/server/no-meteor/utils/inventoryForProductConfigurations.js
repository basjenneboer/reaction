import getVariantInventoryAvailableToSellQuantity from "./getVariantInventoryAvailableToSellQuantity";
import getVariantInventoryInStockQuantity from "./getVariantInventoryInStockQuantity";
import getVariantInventoryNotAvailableToSellQuantity from "./getVariantInventoryNotAvailableToSellQuantity";

const DEFAULT_INFO = {
  inventoryAvailableToSell: 0,
  inventoryInStock: 0,
  inventoryReserved: 0,
  isBackorder: true,
  isLowQuantity: true,
  isSoldOut: true
};

/**
 * @summary Returns an object with inventory information for one or more
 *   product configurations. For performance, it is better to call this
 *   function once rather than calling `inventoryForProductConfiguration`
 *   (singular) in a loop.
 * @param {Object} context App context
 * @param {Object} input Additional input arguments
 * @param {Object[]} input.productConfigurations An array of ProductConfiguration objects
 * @param {String[]} [input.fields] Optional array of fields you need. If you don't need all,
 *   you can pass this to skip some calculations and database lookups, improving speed.
 * @param {Object[]} [input.variants] Optionally pass an array of the relevant variants if
 *   you have already looked them up. This will save a database query.
 * @return {Promise<Object[]>} Array of responses, in same order as `input.productConfigurations` array.
 */
export default async function inventoryForProductConfigurations(context, input) {
  const { collections } = context;
  const { Products } = collections;
  const {
    fields,
    productConfigurations
  } = input;
  let { variants } = input;

  const variantIds = productConfigurations.map(({ variantId }) => variantId);

  if (!variants) {
    variants = await Products.find({
      $or: [
        { _id: { $in: variantIds } },
        { ancestors: { $in: variantIds } }
      ]
    }).toArray();
  }

  return Promise.all(productConfigurations.map(async (productConfiguration) => {
    const { variantId } = productConfiguration;

    const variant = variants.find((listVariant) => listVariant._id === variantId);
    if (!variant) {
      return {
        inventoryInfo: DEFAULT_INFO,
        productConfiguration
      };
    }

    let inventoryAvailableToSell = null;
    let inventoryInStock = null;
    let inventoryReserved = null;
    let isBackorder = null;
    let isLowQuantity = null;
    let isSoldOut = null;

    if (fields.includes("inventoryAvailableToSell") || fields.includes("isBackorder") || fields.includes("isLowQuantity") || fields.includes("isSoldOut")) {
      inventoryAvailableToSell = await getVariantInventoryAvailableToSellQuantity(variant, collections, variants);
    }

    if (fields.includes("inventoryInStock")) {
      inventoryInStock = await getVariantInventoryInStockQuantity(variant, collections, variants);
    }

    if (fields.includes("inventoryReserved")) {
      inventoryReserved = await getVariantInventoryNotAvailableToSellQuantity(variant, collections);
    }

    if (fields.includes("isSoldOut")) {
      isSoldOut = inventoryAvailableToSell <= 0;
    }

    if (fields.includes("isBackorder")) {
      isBackorder = inventoryAvailableToSell <= 0;
    }

    if (fields.includes("isLowQuantity")) {
      const variantOptions = variants.filter((listVariant) => listVariant.ancestors.includes(variantId));
      if (variantOptions.length) {
        const optionInfo = await Promise.all(variantOptions.map(async (option) => ({
          inventoryAvailableToSell: await getVariantInventoryAvailableToSellQuantity(variant, collections, variants),
          lowInventoryWarningThreshold: option.lowInventoryWarningThreshold
        })));
        isLowQuantity = optionInfo.some((option) => option.inventoryAvailableToSell <= variant.lowInventoryWarningThreshold);
      } else {
        isLowQuantity = inventoryAvailableToSell <= variant.lowInventoryWarningThreshold;
      }
    }

    return {
      inventoryInfo: {
        inventoryAvailableToSell,
        inventoryInStock,
        inventoryReserved,
        isBackorder,
        isLowQuantity,
        isSoldOut
      },
      productConfiguration
    };
  }));
}