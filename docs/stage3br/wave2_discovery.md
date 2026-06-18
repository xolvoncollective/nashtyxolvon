Traced OrderService voidOrder and refundOrder. Discovered that voidOrder sets order_status = 'cancelled'. I identified ProductService as the correct owner for inventory mutation.
