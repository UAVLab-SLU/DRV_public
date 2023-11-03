import asyncio

async def foo():
    for i in range(99):
        print('foo')
        await asyncio.sleep(0)

async def bar():
    for i in range(99):
        print('bar')
        await asyncio.sleep(0)


async def main():
    tasks = [foo(), bar()]
    await asyncio.gather(*tasks)

asyncio.run(main())


