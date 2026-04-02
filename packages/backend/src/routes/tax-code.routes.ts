import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const normalizeTaxType = (taxType: unknown) => {
  if (taxType === undefined) {
    return undefined;
  }

  if (typeof taxType !== 'string' || !['INPUT', 'OUTPUT'].includes(taxType)) {
    throw new AppError('taxType 只能是 INPUT 或 OUTPUT', 400);
  }

  return taxType;
};

const normalizeRate = (rate: unknown) => {
  const parsedRate = Number(rate);

  if (!Number.isFinite(parsedRate) || parsedRate < 0) {
    throw new AppError('税率格式不正确', 400);
  }

  return parsedRate > 1 ? parsedRate / 100 : parsedRate;
};

// 获取所有税码
router.get('/', async (req, res, next) => {
  try {
    const taxType = normalizeTaxType(req.query.taxType);
    const taxCodes = await prisma.taxCode.findMany({
      where: {
        isActive: true,
        ...(taxType ? { taxType } : {}),
      },
      orderBy: { rate: 'asc' },
    });

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json({ success: true, data: taxCodes });
  } catch (error) {
    next(error);
  }
});

// 获取单个税码
router.get('/:id', async (req, res, next) => {
  try {
    const taxCode = await prisma.taxCode.findUnique({
      where: { id: req.params.id },
    });

    if (!taxCode) {
      throw new AppError('税码不存在', 404);
    }

    res.json({ success: true, data: taxCode });
  } catch (error) {
    next(error);
  }
});

// 创建税码
router.post('/', async (req, res, next) => {
  try {
    const { code, name, taxType, rate, description, isActive } = req.body;

    if (!code || !name) {
      throw new AppError('税码和名称不能为空', 400);
    }

    const normalizedTaxType = normalizeTaxType(taxType);
    if (!normalizedTaxType) {
      throw new AppError('taxType 不能为空', 400);
    }

    const existing = await prisma.taxCode.findUnique({
      where: { code },
    });

    if (existing) {
      if (!existing.isActive) {
        const reactivatedTaxCode = await prisma.taxCode.update({
          where: { id: existing.id },
          data: {
            code,
            name,
            taxType: normalizedTaxType,
            rate: normalizeRate(rate),
            description,
            isActive: true,
          },
        });

        return res.json({
          success: true,
          data: reactivatedTaxCode,
        });
      }

      throw new AppError('税码已存在', 400);
    }

    const taxCode = await prisma.taxCode.create({
      data: {
        code,
        name,
        taxType: normalizedTaxType,
        rate: normalizeRate(rate),
        description,
        isActive: isActive ?? true,
      },
    });

    res.json({ success: true, data: taxCode });
  } catch (error) {
    next(error);
  }
});

// 更新税码
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, taxType, rate, description, isActive } = req.body;

    const existing = await prisma.taxCode.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('税码不存在', 404);
    }

    if (code && code !== existing.code) {
      const duplicate = await prisma.taxCode.findUnique({
        where: { code },
      });

      if (duplicate) {
        throw new AppError('税码已存在', 400);
      }
    }

    const taxCode = await prisma.taxCode.update({
      where: { id },
      data: {
        ...(code !== undefined ? { code } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(taxType !== undefined ? { taxType: normalizeTaxType(taxType) } : {}),
        ...(rate !== undefined ? { rate: normalizeRate(rate) } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    res.json({ success: true, data: taxCode });
  } catch (error) {
    next(error);
  }
});

// 删除税码（软删除）
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.taxCode.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      throw new AppError('税码不存在', 404);
    }

    const taxCode = await prisma.taxCode.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, data: taxCode });
  } catch (error) {
    next(error);
  }
});

export default router;
