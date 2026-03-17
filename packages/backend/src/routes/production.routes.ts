import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 生成生产订单编号
async function generateOrderNo() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.productionOrder.count({
    where: {
      orderNo: { startsWith: `PO-${dateStr}` }
    }
  });
  return `PO-${dateStr}-${String(count + 1).padStart(4, '0')}`;
}

// 生成生产收货单编号
async function generateReceiptNo() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.productionReceipt.count({
    where: {
      receiptNo: { startsWith: `PR-${dateStr}` }
    }
  });
  return `PR-${dateStr}-${String(count + 1).padStart(4, '0')}`;
}

// 获取生产订单列表
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNo: { contains: search } },
        { remark: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.productionOrder.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              material: true,
            }
          }
        }
      }),
      prisma.productionOrder.count({ where })
    ]);

    res.json({
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('获取生产订单列表失败:', error);
    res.status(500).json({ message: error.message });
  }
});

// 获取生产订单详情
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            material: true,
          }
        },
        receipts: {
          include: {
            items: {
              include: {
                material: true,
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json(order);
  } catch (error: any) {
    console.error('获取生产订单详情失败:', error);
    res.status(500).json({ message: error.message });
  }
});

// 创建生产订单
router.post('/orders', async (req, res) => {
  try {
    const { orderDate, expectedDate, remark, items } = req.body;

    // 生成订单编号
    const orderNo = await generateOrderNo();

    // 计算总金额
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    // 创建订单
    const order = await prisma.productionOrder.create({
      data: {
        orderNo,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        status: 'PENDING',
        totalAmount,
        remark,
        items: {
          create: items.map((item: any) => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0,
            amount: item.quantity * (item.unitPrice || 0),
          }))
        }
      },
      include: {
        items: {
          include: {
            material: true,
          }
        }
      }
    });

    res.status(201).json(order);
  } catch (error: any) {
    console.error('创建生产订单失败:', error);
    res.status(500).json({ message: error.message });
  }
});

// 更新生产订单
router.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { orderDate, expectedDate, status, remark, items } = req.body;

    // 如果有更新items，先删除旧的
    if (items) {
      await prisma.productionOrderItem.deleteMany({ where: { orderId: id } });
    }

    // 计算总金额
    const totalAmount = items ? items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0) : undefined;

    const order = await prisma.productionOrder.update({
      where: { id },
      data: {
        orderDate: orderDate ? new Date(orderDate) : undefined,
        expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        status,
        remark,
        totalAmount,
        ...(items && {
          items: {
            create: items.map((item: any) => ({
              materialId: item.materialId,
              quantity: item.quantity,
              unitPrice: item.unitPrice || 0,
              amount: item.quantity * (item.unitPrice || 0),
            }))
          }
        })
      },
      include: {
        items: {
          include: {
            material: true,
          }
        }
      }
    });

    res.json(order);
  } catch (error: any) {
    console.error('更新生产订单失败:', error);
    res.status(500).json({ message: error.message });
  }
});

// 删除生产订单
router.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 先删除关联的收货单
    await prisma.productionReceipt.deleteMany({ where: { orderId: id } });
    // 再删除订单明细
    await prisma.productionOrderItem.deleteMany({ where: { orderId: id } });
    // 最后删除订单
    await prisma.productionOrder.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error: any) {
    console.error('删除生产订单失败:', error);
    res.status(500).json({ message: error.message });
  }
});

// 获取生产收货单列表
router.get('/receipts', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { receiptNo: { contains: search } },
        { remark: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [receipts, total] = await Promise.all([
      prisma.productionReceipt.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          order: true,
          items: {
            include: {
              material: true,
            }
          }
        }
      }),
      prisma.productionReceipt.count({ where })
    ]);

    res.json({
      success: true,
      data: receipts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取生产收货单失败:', error);
    res.status(500).json({ success: false, error: '获取生产收货单失败' });
  }
});

// 获取生产收货单详情
router.get('/receipts/:id', async (req, res) => {
  try {
    const receipt = await prisma.productionReceipt.findUnique({
      where: { id: req.params.id },
      include: {
        order: true,
        items: {
          include: {
            material: true,
            orderItem: true,
          }
        }
      }
    });

    if (!receipt) {
      return res.status(404).json({ success: false, error: '生产收货单不存在' });
    }

    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error('获取生产收货单详情失败:', error);
    res.status(500).json({ success: false, error: '获取生产收货单详情失败' });
  }
});

// 创建生产收货单
router.post('/receipts', async (req, res) => {
  try {
    const { orderId, receiptDate, status, remark, items } = req.body;

    // 生成收货单编号
    const receiptNo = await generateReceiptNo();

    // 创建收货单及明细
    const receipt = await prisma.productionReceipt.create({
      data: {
        receiptNo,
        orderId,
        receiptDate: receiptDate || new Date(),
        status: status || 'PENDING',
        remark,
        items: {
          create: items.map((item: any) => ({
            orderItemId: item.orderItemId,
            materialId: item.materialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0,
          }))
        }
      },
      include: {
        items: {
          include: {
            material: true,
          }
        }
      }
    });

    // 更新生产订单明细的已收货数量
    for (const item of items) {
      await prisma.productionOrderItem.update({
        where: { id: item.orderItemId },
        data: {
          receivedQuantity: {
            increment: item.quantity
          }
        }
      });
    }

    // 检查生产订单是否全部完成
    const order = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    const allCompleted = order?.items.every(item =>
      item.receivedQuantity >= item.quantity
    );

    if (allCompleted) {
      await prisma.productionOrder.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' }
      });
    } else {
      await prisma.productionOrder.update({
        where: { id: orderId },
        data: { status: 'IN_PROGRESS' }
      });
    }

    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error('创建生产收货单失败:', error);
    res.status(500).json({ success: false, error: '创建生产收货单失败' });
  }
});

// 确认生产收货单（更新库存）
router.post('/receipts/:id/confirm', async (req, res) => {
  try {
    const receipt = await prisma.productionReceipt.findUnique({
      where: { id: req.params.id },
      include: {
        items: true
      }
    });

    if (!receipt) {
      return res.status(404).json({ success: false, error: '生产收货单不存在' });
    }

    if (receipt.status === 'COMPLETED') {
      return res.status(400).json({ success: false, error: '收货单已完成确认' });
    }

    // 更新库存（入库）
    for (const item of receipt.items) {
      await prisma.material.update({
        where: { id: item.materialId },
        data: {
          currentStock: {
            increment: item.quantity
          }
        }
      });

      // 创建库存交易记录
      await prisma.inventoryTransaction.create({
        data: {
          materialId: item.materialId,
          transactionType: 'IN',
          quantity: item.quantity,
          unitCost: item.unitPrice,
          referenceType: 'PRODUCTION_RECEIPT',
          referenceId: receipt.id,
          transactionDate: new Date(),
        }
      });
    }

    // 更新收货单状态
    await prisma.productionReceipt.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('确认生产收货单失败:', error);
    res.status(500).json({ success: false, error: '确认生产收货单失败' });
  }
});

// 删除生产收货单
router.delete('/receipts/:id', async (req, res) => {
  try {
    const receipt = await prisma.productionReceipt.findUnique({
      where: { id: req.params.id },
      include: {
        items: true
      }
    });

    if (!receipt) {
      return res.status(404).json({ success: false, error: '生产收货单不存在' });
    }

    // 如果已确认，需要还原库存
    if (receipt.status === 'COMPLETED') {
      for (const item of receipt.items) {
        // 还原库存
        await prisma.material.update({
          where: { id: item.materialId },
          data: {
            currentStock: {
              decrement: item.quantity
            }
          }
        });

        // 删除库存交易记录
        await prisma.inventoryTransaction.deleteMany({
          where: {
            referenceType: 'PRODUCTION_RECEIPT',
            referenceId: receipt.id
          }
        });

        // 还原已收货数量
        await prisma.productionOrderItem.update({
          where: { id: item.orderItemId },
          data: {
            receivedQuantity: {
              decrement: item.quantity
            }
          }
        });
      }
    }

    // 删除明细
    await prisma.productionReceiptItem.deleteMany({
      where: { receiptId: req.params.id }
    });

    // 删除收货单
    await prisma.productionReceipt.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('删除生产收货单失败:', error);
    res.status(500).json({ success: false, error: '删除生产收货单失败' });
  }
});

// ========== BOM管理 ==========

// 获取BOM列表
router.get('/boms', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [boms, total] = await Promise.all([
      prisma.bOM.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              material: true,
            }
          }
        }
      }),
      prisma.bOM.count({ where })
    ]);

    res.json({
      success: true,
      data: boms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取BOM列表失败:', error);
    res.status(500).json({ success: false, error: '获取BOM列表失败' });
  }
});

// 获取BOM详情
router.get('/boms/:id', async (req, res) => {
  try {
    const bom = await prisma.bOM.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            material: true,
          }
        }
      }
    });

    if (!bom) {
      return res.status(404).json({ success: false, error: 'BOM不存在' });
    }

    res.json({ success: true, data: bom });
  } catch (error) {
    console.error('获取BOM详情失败:', error);
    res.status(500).json({ success: false, error: '获取BOM详情失败' });
  }
});

// 创建BOM
router.post('/boms', async (req, res) => {
  try {
    const { code, name, version, status, remark, items } = req.body;

    // 检查编码是否已存在
    const existing = await prisma.bOM.findUnique({
      where: { code }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'BOM编码已存在' });
    }

    const bom = await prisma.bOM.create({
      data: {
        code,
        name,
        version: version || '1.0',
        status: status || 'ACTIVE',
        remark,
        items: items ? {
          create: items.map((item: any) => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unit: item.unit || '个',
          }))
        } : undefined
      },
      include: {
        items: {
          include: {
            material: true,
          }
        }
      }
    });

    res.json({ success: true, data: bom });
  } catch (error) {
    console.error('创建BOM失败:', error);
    res.status(500).json({ success: false, error: '创建BOM失败' });
  }
});

// 更新BOM
router.put('/boms/:id', async (req, res) => {
  try {
    const { name, version, status, remark, items } = req.body;

    // 如果有更新items，先删除旧的
    if (items) {
      await prisma.bOMItem.deleteMany({
        where: { bomId: req.params.id }
      });

      await prisma.bOM.update({
        where: { id: req.params.id },
        data: {
          name,
          version,
          status,
          remark,
          items: {
            create: items.map((item: any) => ({
              materialId: item.materialId,
              quantity: item.quantity,
              unit: item.unit || '个',
            }))
          }
        },
        include: {
          items: {
            include: {
              material: true,
            }
          }
        }
      });
    } else {
      const bom = await prisma.bOM.update({
        where: { id: req.params.id },
        data: {
          name,
          version,
          status,
          remark,
        },
        include: {
          items: {
            include: {
              material: true,
            }
          }
        }
      });
      res.json({ success: true, data: bom });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('更新BOM失败:', error);
    res.status(500).json({ success: false, error: '更新BOM失败' });
  }
});

// 删除BOM
router.delete('/boms/:id', async (req, res) => {
  try {
    // 先删除明细
    await prisma.bOMItem.deleteMany({
      where: { bomId: req.params.id }
    });

    // 再删除BOM
    await prisma.bOM.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('删除BOM失败:', error);
    res.status(500).json({ success: false, error: '删除BOM失败' });
  }
});

export default router;
