const test = require('ava')
let cryptoNight = require('cryptonight-hashing')['randomx'];


test("Test hashing", t => {
	const convertedBlob = "0c0cc994f1f80539c14e1b967b82e78d4ca19fc9d8697999c1cb2f9ed146157dda0bbf3f960c59770400004a2558f7f539e482cc7f931766d1e5c70d9bcc405a48fb5e24e5909ef697ea8501"
	const buff = "dc52b8204b05279b1d9bd48c426e22a8165446c0e0d9d7d4c57c722c7070b480"
	const output = "f2fe02ceab2adae22307b4c15a8ac786184997edc216558f7d2d1cec8a1c0100"
	const hash = cryptoNight(Buffer.from(convertedBlob,'hex'), Buffer.from(buff, 'hex'));
	t.is(Buffer.from(hash,'hex').toString('hex'), output)
});


test("Test hashing again", t => {
	const convertedBlob = "0c0cf5f5cf800624d2492783c90e3841b1add5f251fea132feba069debab796cddc00cc4bf6ed700000000bebf4ed623823aa6abe2b527366bd4fdb737ae2d7a18cfde2d1f24656757014f01"
	const buff = "dc52b8204b05279b1d9bd48c426e22a8165446c0e0d9d7d4c57c722c7070b480"
	const output = "457965afcbc03a536574c0b0c93047a80acba3bb04e93b5dd971f88c34f6d785"
	const hash = cryptoNight(Buffer.from(convertedBlob,'hex'), Buffer.from(buff, 'hex'));
	t.is(Buffer.from(hash,'hex').toString('hex'), output)
});


// 0c0cf5f5cf800624d2492783c90e3841b1add5f251fea132feba069debab796cddc00cc4bf6ed700000000bebf4ed623823aa6abe2b527366bd4fdb737ae2d7a18cfde2d1f24656757014f01