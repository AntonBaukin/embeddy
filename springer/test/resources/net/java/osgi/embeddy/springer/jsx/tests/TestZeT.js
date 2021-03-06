/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                          Test Cases                           |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

function helloWorld()
{
	JsX.once('zet/basics.js')
	print('Hello, ', 'World!')
}

function testMinimum()
{
	var ZeT = JsX.include('zet/mini.js')

	function assert(x)
	{
		if(x !== true) throw new Error('Assertion failed!')
	}

	function ks(obj)
	{
		return ZeT.keys(obj).join('')
	}

	function sum()
	{
		var r = arguments[0]
		for(var i = 1;(i < arguments.length);i++)
			r += arguments[i]
		return r
	}

	function a()
	{
		return arguments
	}

	function jmap(o)
	{
		var x = new java.util.LinkedHashMap()
		x.putAll(o)
		return x
	}


	//--> keys

	assert('a2c' == ['a', 2, 'c'].join(''))
	assert('abc' == ks({ a: 'a', b: 2, c: "c" }))


	//--> keys of Java Map

	assert(jmap({ a: 'a' }) instanceof ZeT.JAVA_MAP)
	assert(3 == ZeT.keys(jmap({ a: 'a', b: 2, c: "c" })).length)
	assert('abc' == ks(jmap({ a: 'a', b: 2, c: "c" })))


	//--> extend

	var A = jmap({ a: 'a', b: 'b' })
	assert('ab' == ks(A))

	var B = ZeT.extend(A, { c: 'x', d: 'y' })
	assert(A === B)
	assert('abcd' == ks(A))
	assert(A.a === 'a' && A.d === 'y')


	//--> scope

	assert(true  === ZeT.scope(function(){ return true  }))
	assert(false === ZeT.scope(function(){ return false }))

	assert('a'   === ZeT.scope('a', sum))
	assert('ab'  === ZeT.scope('a', 'b', sum))
	assert('a0c' === ZeT.scope('a', 0, 'c', sum))


	//--> concatenation indexed

	assert(''     === ZeT.cati())
	assert(''     === ZeT.cati(10))

	assert(''     === ZeT.cati(1,  ['a']))
	assert('a'    === ZeT.cati(0,  ['a']))
	assert('a'    === ZeT.cati(0, a('a')))

	assert(''     === ZeT.cati(2,  ['a', 'b']))
	assert('ab'   === ZeT.cati(0,  ['a', 'b']))
	assert('abc'  === ZeT.cati(0, a('a', 'b', 'c')))


	assert('b'    === ZeT.cati(1,  ['a', 'b']))
	assert('bc'   === ZeT.cati(1, a('a', 'b', 'c')))
	assert('c'    === ZeT.cati(2, a('a', 'b', 'c')))
	assert(''     === ZeT.cati(3,  ['a', 'b', 'c']))

	assert('abcd' === ZeT.cati(0,  ['a', ['b', 'c'], 'd']))
	assert('abcd' === ZeT.cati(0,  ['a', a('b', 'c'), 'd']))

	//--> stack

	assert(ZeT.stack().indexOf('testMinimum') != -1)
}

function testChecks()
{
	var ZeT = JsX.include('zet/checks.js')

	function a()
	{
		return arguments
	}

	function assert(x)
	{
		if(x !== true) throw new Error('Assertion failed!')
	}

	function helloWorld()
	{}

	function jmap(o)
	{
		var x = new java.util.LinkedHashMap()
		x.putAll(o)
		return x
	}


	//--> is strings

	assert(ZeT.iss(''))
	assert(ZeT.iss('abc'))
	assert(ZeT.iss('1.0'))
	assert(!ZeT.iss(true))
	assert(!ZeT.iss({}))
	assert(!ZeT.iss(1.0))
	assert(!ZeT.iss(null))
	assert(!ZeT.iss(undefined))


	//--> is functions

	assert(ZeT.isf(helloWorld))
	assert(!ZeT.isf(true))
	assert(!ZeT.isf(''))
	assert(!ZeT.isf({}))
	assert(!ZeT.isf(1.0))
	assert(!ZeT.isf(null))
	assert(!ZeT.isf(undefined))


	//--> is boolean

	assert(ZeT.isb(true))
	assert(ZeT.isb(false))
	assert(ZeT.isb(true && false))
	assert(!ZeT.isb(helloWorld))
	assert(!ZeT.isb(''))
	assert(!ZeT.isb({}))
	assert(!ZeT.isb(1.0))
	assert(!ZeT.isb(null))
	assert(!ZeT.isb(undefined))


	//--> is undefined

	assert(ZeT.isu(undefined))
	assert(!ZeT.isu(null))
	assert(!ZeT.isu(true))
	assert(!ZeT.isu(helloWorld))
	assert(!ZeT.isu(''))
	assert(!ZeT.isu({}))
	assert(!ZeT.isu(1.0))


	//--> is x-check

	var X  = { a: 'a', b: [ 0, null, true, 'b', false, { c: 'c', d: [ 0, 1 ]}]}
	var Xd = function(d)
	{
		return ZeT.isa(d) && (d[0] === 0) && (d[1] === 1)
	}

	assert( ZeT.isx(X.xyz))
	assert( ZeT.isx(null, X, 'xyz'))
	assert( ZeT.isx(X.b[1]))
	assert( ZeT.isx(null, X, 'b', 1))
	assert(!ZeT.isx(null, X, 'b', 0))
	assert(!ZeT.isx(null, X, 'b', 2))
	assert( ZeT.isx(true, X, 'b', 2))
	assert( ZeT.isx(1, X, 'b', 2))
	assert( ZeT.isx(false, X, 'b', 4))
	assert( ZeT.isx(0, X, 'b', 4))
	assert(!ZeT.isx(1, X, 'b', 4))
	assert( ZeT.isx('c', X, 'b', 5, 'c'))
	assert( ZeT.isx(null, X, 'b', 5, 'xyz'))
	assert( ZeT.isx(Xd, X, 'b', 5, 'd'))


	//--> is array

	assert(ZeT.isa([]))
	assert(ZeT.isa([1, 2, 3]))
	assert(ZeT.isa(new Array(10)))
	assert(!ZeT.isa(null))
	assert(!ZeT.isa(undefined))
	assert(!ZeT.isa(true))
	assert(!ZeT.isa(helloWorld))
	assert(!ZeT.isa(''))
	assert(!ZeT.isa('abc'))
	assert(!ZeT.isa({}))
	assert(!ZeT.isa(1.0))


	//--> is array-like

	assert(ZeT.isax([]))
	assert(ZeT.isax([1, 2, 3]))
	assert(ZeT.isax(new Array(10)))
	assert(ZeT.isax({ length: 3 }))
	assert(ZeT.isax(a(0, '1', null)))
	assert(!ZeT.isax(null))
	assert(!ZeT.isax(undefined))
	assert(!ZeT.isax(true))
	assert(!ZeT.isax(helloWorld))
	assert(!ZeT.isax(''))
	assert(!ZeT.isax('abc'))
	assert(!ZeT.isax({}))
	assert(!ZeT.isax(1.0))


	//--> is numbers

	assert(ZeT.isn(0))
	assert(ZeT.isi(0))
	assert(ZeT.isn(1.1))
	assert(!ZeT.isn({}))
	assert(!ZeT.isn('1'))
	assert(ZeT.isi(101))
	assert(!ZeT.isi(10.1))
	assert(!ZeT.isi('10'))
	assert(!ZeT.isi({}))

	assert(ZeT.isn(parseInt('1475625600000')))
	assert(ZeT.isi(parseInt('1475625600000')))
	assert(ZeT.isi(parseFloat('1475625600000')))
	assert(!ZeT.isi(parseFloat('1475625600000.99')))


	//--> is object

	assert(ZeT.isox({}))
	assert(ZeT.isox({a: 'a', b: true, c: {}}))
	assert(ZeT.isox(new Object()))
	assert(ZeT.isox(jmap({a: 'a', b: true, c: {}})))
	assert(!ZeT.isox(null))
	assert(!ZeT.isox(undefined))
	assert(!ZeT.isox(true))
	assert(!ZeT.isox(helloWorld))
	assert(!ZeT.isox('abc'))
	assert(!ZeT.isox([]))
	assert(!ZeT.isox(1.0))
	assert(!ZeT.isox(0))
	assert(!ZeT.isox(10))


	//--> is plain object

	function P()
	{
		this.hello = 'Hello, World!'
	}

	assert(ZeT.iso({}))
	assert(ZeT.iso({a: 'a', b: true, c: {}}))
	assert(ZeT.iso(new Object()))
	assert(ZeT.iso(jmap({a: 'a', b: true, c: {}})))
	assert(!ZeT.iso(new P()))
	assert(!ZeT.iso(null))
	assert(!ZeT.iso(undefined))
	assert(!ZeT.iso(true))
	assert(!ZeT.iso(helloWorld))
	assert(!ZeT.iso('abc'))
	assert(!ZeT.iso([]))
	assert(!ZeT.iso(1.0))
	assert(!ZeT.iso(0))
	assert(!ZeT.iso(10))


	//--> test

	assert(!ZeT.test())
	assert(!ZeT.test(null))
	assert(!ZeT.test(undefined))
	assert(!ZeT.test(0))
	assert(!ZeT.test(0.0))
	assert( ZeT.test(1))
	assert(!ZeT.test(''))
	assert(!ZeT.test(' '))
	assert( ZeT.test(' a bc'))
	assert(!ZeT.test([]))
	assert(!ZeT.test([ 0 ]))
	assert( ZeT.test([ 1 ]))
	assert( ZeT.test([ 0, 1 ]))
	assert( ZeT.test(assert))
	assert( ZeT.test([ assert ]))
	assert(!ZeT.test([ null, 0, '' ]))
	assert( ZeT.test([ null, 1, '' ]))
	assert( ZeT.test([ null, 0, ' a ' ]))
}

function testAsserts()
{
	var ZeT = JsX.include('zet/asserts.js')

	function test(a, args)
	{
		if(!ZeT.isa(args))
			args = [ args ]

		try
		{
			a.apply(this, args)
		}
		catch(e)
		{
			return
		}

		throw new Error('Assertion ' + a + ' didn\'t throw error on [' + args + ']!')
	}

	function helloWorld()
	{}


	//--> assert

	test(ZeT.assert, false)
	test(ZeT.assert, null)
	test(ZeT.assert, undefined)
	test(ZeT.assert, 0)
	test(ZeT.assert, '')
	ZeT.assert(true)
	ZeT.assert(1)
	ZeT.assert(helloWorld)


	//--> assert not null

	test(ZeT.assertn, null)
	test(ZeT.assertn, undefined)
	ZeT.assertn(true)
	ZeT.assertn(0)
	ZeT.assertn('')
	ZeT.assertn(helloWorld)


	//--> assert is function

	test(ZeT.assertf, null)
	test(ZeT.assertf, undefined)
	test(ZeT.assertf, {})
	test(ZeT.assertf, '')
	ZeT.assertf(helloWorld)


	//--> assert not whitespace-empty string

	test(ZeT.asserts, null)
	test(ZeT.asserts, undefined)
	test(ZeT.asserts, '')
	test(ZeT.asserts, '  ')
	test(ZeT.asserts, ' \t  \r\n ')
	ZeT.asserts('abc')
	ZeT.asserts('ab c ')
	ZeT.asserts('ab c \n')


	//--> assert not empty array

	test(ZeT.asserta, null)
	test(ZeT.asserta, undefined)
	test(ZeT.asserta, [])
	test(ZeT.asserta, new Array(4))
	test(ZeT.asserta, {0: 'a', 1: 1.0})
	ZeT.asserta([null])
	ZeT.asserta([0, 1])
}

function testBasics()
{
	var ZeT = JsX.include('zet/basics.js')

	function args()
	{
		return arguments
	}

	function sum(a)
	{
		for(var r = a[0], i = 1;(i < a.length);i++)
			r += a[i]
		return r
	}


	//--> init (once)

	var that = ZeT.init('that', function(){ return {} })

	ZeT.assert(that === ZeT.init('that'))
	ZeT.assert(that === ZeT.init('that', function()
	{
		throw ZeT.ass('Defined again!')
	}))


	//--> define

	var a = {}, ab = {}, abc = {}

	ZeT.assert(ZeT.isu(ZeT.define('aaa')))
	ZeT.assert(a === ZeT.define('aaa', a))
	ZeT.assert(a === ZeT.define('aaa', {}))
	ZeT.assert(a === ZeT.define('aaa'))

	ZeT.assert(ZeT.isu(ZeT.define('aaa.bb')))
	ZeT.assert(ab === ZeT.define('aaa.bb', ab))
	ZeT.assert(ab === ZeT.define('aaa.bb', {}))
	ZeT.assert(ab === ZeT.define('aaa.bb'))

	ZeT.assert(ZeT.isu(ZeT.define('aaa.bb.c')))
	ZeT.assert(abc === ZeT.define('aaa.bb.c', abc))
	ZeT.assert(abc === ZeT.define('aaa.bb.c', {}))
	ZeT.assert(abc === ZeT.define('aaa.bb.c'))


	//--> copy prototype

	function A(x)
	{
		this.x = x
	}

	ZeT.extend(A.prototype, {
		a: 'a', b: 'b', plus: function()
		{
			return this.a + this.x + this.b
		}
	})

	var a = new A('+')
	ZeT.assert('a+b' === a.plus())

	var b = ZeT.proto(a)
	ZeT.assert(ZeT.isu(x))
	b.x = '?'
	ZeT.assert('a?b' === b.plus())


	//--> array-like

	var x = [], y = { length: 3, 0: 'a', 1: 'b', 2: 'c', 3: '!' }
	var z = { abc: 'abc', toArray: function(){ return this.abc.split('') }}

	ZeT.assert(ZeT.isa(ZeT.a()))
	ZeT.assert(ZeT.isa(ZeT.a(y)))

	ZeT.assert('abc' === ZeT.a('abc')[0])
	ZeT.assert(sum   === ZeT.a(sum)[0])
	ZeT.assert(x     === ZeT.a(x))
	ZeT.assert(y     !== ZeT.a(y))
	ZeT.assert('abc' === sum(ZeT.a(y)))
	ZeT.assert('abc' === sum(ZeT.a(args('a', 'b', 'c'))))
	ZeT.assert('abc' === sum(ZeT.a(z)))
}

function testStrings()
{
	var ZeT  = JsX.once('zet/basics.js')
	var ZeTS = JsX.once('zet/strings.js')

	//--> is empty string

	ZeT.assert(ZeTS.ises(''))
	ZeT.assert(ZeTS.ises('  '))
	ZeT.assert(ZeTS.ises(' \r \t\n'))
	ZeT.assert(!ZeTS.ises('123'))
	ZeT.assert(!ZeTS.ises(' 123 '))
	ZeT.assert(!ZeTS.ises(' 1\t23 \n'))


	//--> trim

	ZeT.assert(ZeTS.trim(' abc') == 'abc')
	ZeT.assert(ZeTS.trim('abc ') == 'abc')
	ZeT.assert(ZeTS.trim(' abc ') == 'abc')
	ZeT.assert(ZeTS.trim('\r abc \n\t') == 'abc')


	//--> first letter

	ZeT.assert(ZeTS.first('abc') == 'a')
	ZeT.assert(ZeTS.first(' abc') == ' ')


	//--> starts with

	ZeT.assert(ZeTS.starts('abc', 'abc'))
	ZeT.assert(ZeTS.starts(' abcde', ' abc'))
	ZeT.assert(!ZeTS.starts(' abcde', 'abc'))


	//--> ends with

	ZeT.assert(ZeTS.ends('abc', 'abc'))
	ZeT.assert(ZeTS.ends('abcde\t', 'de\t'))
	ZeT.assert(ZeTS.ends('abcde\t', '\t'))
	ZeT.assert(!ZeTS.ends(' abcde', 'cd'))


	//--> substitution

	ZeT.assert(ZeTS.replace('abc', 'b', '123') == 'a123c')
	ZeT.assert(ZeTS.replace('abc', 'abc', '123') == '123')


	//--> concatenate

	var O = {toString: function() {return '!'}}

	ZeT.assert(ZeTS.cat(10.0, null, ' != ', O) == '10 != !')
	ZeT.assert(ZeTS.cati(2, ['abc', null, '-> ', O]) == '-> !')


	//--> concatenate if

	ZeT.assert(ZeTS.catif(true, 'a', 2, 'b') == 'a2b')
	ZeT.assert(ZeTS.catif(0, 'a', 2, 'b') == '')
	ZeT.assert(ZeTS.catif('', 'a', 2, 'b') == '')
	ZeT.assert(ZeTS.catif('0', 'a', 2, 'b') == 'a2b')


	//--> concatenate if all

	ZeT.assert(ZeTS.catifall('a', 2, 'b') == 'a2b')
	ZeT.assert(ZeTS.catifall('a', null, 'b') == '')
	ZeT.assert(ZeTS.catifall('a', 0, 'b') == '')
	ZeT.assert(ZeTS.catifall('a', '', 'b') == '')


	//--> concatenate with separator

	ZeT.assert(ZeTS.catsep('-', 'a', 2, 'b') == 'a-2-b')
	ZeT.assert(ZeTS.catsep('-', 'a', [1, 2, 3], 'b') == 'a-1-2-3-b')
	ZeT.assert(ZeTS.catsep(' ', 'a', [[1, 2], 3, [4, 5]], 'b') == 'a 1 2 3 4 5 b')


	//--> each

	function xeach(s)
	{
		var a = ''; ZeTS.each(s, function(x){ a += x }); return a
	}

	function yeach(sep, s)
	{
		var a = ''; ZeTS.each(sep, s, function(x){ a += x }); return a
	}

	ZeT.assert('' == xeach(''))
	ZeT.assert('' == xeach('   '))
	ZeT.assert('' == yeach('-', ''))
	ZeT.assert('' == yeach('-', '---'))

	ZeT.assert('ab' == xeach('ab'))
	ZeT.assert('ab' == xeach(' ab '))

	ZeT.assert('ab' == yeach('-', 'ab'))
	ZeT.assert('ab' == yeach('-', '-ab--'))

	ZeT.assert('abc' == xeach('a  b c'))
	ZeT.assert('abc' == xeach(' a b c  '))

	ZeT.assert('abc' == yeach('-', 'a--b-c'))
	ZeT.assert('abc' == yeach('-', '-a-b--c--'))
}

function testArrays()
{
	var ZeT  = JsX.once('zet/basics.js')
	var ZeTA = JsX.once('zet/arrays.js')

	//--> equals

	ZeT.assert(ZeTA.eq([], []))
	ZeT.assert(ZeTA.eq([1, 2, 3], [1, 2, 3]))
	ZeT.assert(!ZeTA.eq([2, 1, 3], [1, 2, 3]))
	ZeT.assert(ZeTA.eq('abc', "abc"))
	ZeT.assert(!ZeTA.eq('abc', "aBc"))
	ZeT.assert(ZeTA.eq('abc', ['a', 'b', 'c']))


	//--> copy

	var B = [0, 1, 2, 3, 4, 5]
	ZeT.assert(ZeTA.copy(B) !== B)
	ZeT.assert(ZeTA.eq(ZeTA.copy(B), B))
	ZeT.assert(ZeTA.eq(ZeTA.copy(B, 3), [3, 4, 5]))
	ZeT.assert(ZeTA.eq(ZeTA.copy(B, 2, 6), [2, 3, 4, 5]))
	ZeT.assert(ZeTA.eq(ZeTA.copy(B, 2, 4), [2, 3]))


	//--> remove

	ZeT.assert(ZeTA.eq(B, ZeTA.remove(ZeTA.copy(B))))
	ZeT.assert(ZeTA.eq([1, 5], ZeTA.remove(ZeTA.copy(B), 0, 2, 3, 4)))
	ZeT.assert(ZeTA.eq([1, 5], ZeTA.remove(ZeTA.copy(B), [0, 2, 3, 4])))
	ZeT.assert(ZeTA.eq([1, 5], ZeTA.remove(ZeTA.copy(B), [0, 2, [3, 4]])))


	//--> concatenate

	ZeT.assert(ZeTA.eq([], ZeTA.concat([], [])))
	ZeT.assert(ZeTA.eq(B, ZeTA.concat([0, 1, 2], [3, 4, 5])))
	ZeT.assert(ZeTA.eq(B, ZeTA.concat([0, 1], B, 2)))
	ZeT.assert(ZeTA.eq([0, 1, 3, 4], ZeTA.concat([0, 1], B, 3, 5)))
}

function testExtends()
{
	var ZeT = JsX.once('zet/extends.js')

	function ks(obj)
	{
		return ZeT.keys(obj).join('')
	}

	function xyz()
	{
		var r = ZeT.isn(this)?(this):(0)

		for(var i = 0;(i < arguments.length);i++)
			if(ZeT.isn(arguments[i]))
				r += ((i%2 == 0)?(+1):(-1)) * arguments[i]

		return r
	}

	function args()
	{
		return arguments
	}


	//--> keys

	ZeT.assert('a2c' == ['a', 2, 'c'].join(''))
	ZeT.assert('abc' == ks({ a: 'a', b: 2, c: "c" }))


	//--> clone

	var A = { a: 'a', b: 'b' }
	ZeT.assert('ab' == ks(A))

	var B = ZeT.clone(A)
	ZeT.assert('ab' == ks(A))


	//--> deep clone

	function Xu(obj)
	{
		ZeT.extend(this, obj)
	}

	ZeT.extend(Xu.prototype, { x: 1, y: 2 })

	A = new Xu({ a: 'a', b: { c: [ '?', 'c' ], d: 'd' }})
	ZeT.assert('ab' == ks(A))
	ZeT.assert('cd' == ks(A.b))
	ZeT.assert(Object.getPrototypeOf(A).x === 1)
	ZeT.assert(A.x === 1 && A.y === 2)

	B = ZeT.deepClone(A)
	ZeT.assert(A != B)
	ZeT.assert('ab' == ks(B))
	ZeT.assert(A.b != B.b)
	ZeT.assert('cd' == ks(B.b))
	ZeT.assert(B.b.c[1] === 'c' && B.b.d === 'd')
	ZeT.assert(B.x === 1 && B.y === 2)


	//--> deep extend

	var C = ZeT.deepExtend(B, { x: 'x', b: { c: 1, e: { f: 'f', g: 'g' }}})

	ZeT.assert(C === B)
	ZeT.assert(B.x === 1)
	ZeT.assert('ab' == ks(B))
	ZeT.assert(B.b.c[1] === 'c')
	ZeT.assert('cde' == ks(B.b))
	ZeT.assert('fg' == ks(B.b.e))
	ZeT.assert(B.b.e.f === 'f' && B.b.e.g === 'g')


	//--> get

	ZeT.assert(ZeT.get(B, 'b', 'c', 1) === 'c')
	ZeT.assert(ZeT.get(B, 'b', 'e', 'f') === 'f')


	//--> function bind

	var f = ZeT.fbind(xyz, -3)
	ZeT.assert(4 == xyz.call(1, 2, 3, 4))
	ZeT.assert(0 == f.call(100, 2, 3, 4))

	f = ZeT.fbind(xyz, -3, 2, 3)
	ZeT.assert(0 == f.call(100, 4))


	//--> function bind array

	f = ZeT.fbinda(xyz, -3)
	ZeT.assert(0 == f.call(100, 2, 3, 4))

	f = ZeT.fbinda(xyz, -3, [2, 3])
	ZeT.assert(0 == f.call(100, 4))


	//--> function bind universal

	f = ZeT.fbindu(xyz, -3)
	ZeT.assert(0 == f.call(100, 2, 3, 4))

	f = ZeT.fbindu(xyz, -3, 0, 2, 2, 4)
	ZeT.assert(0 == f.call(100, 3))
	ZeT.assert(1 == f.call(100, 3, 10, 11))


	//--> scope if

	ZeT.assert(null === ZeT.scopeif(0, 1, 2, 3, xyz))
	ZeT.assert(-2 === ZeT.scopeif(1, 2, 3, 4, xyz))


	//--> evaluation

	ZeT.assert('a2c' === ZeT.xeval(" return 'a' + 2 + 'c' "))


	//--> each array

	ZeT.assert(4 == ZeT.each(args('0', '1', '2', '3'), function(x, i)
	{
		ZeT.assert(x == this) //!: not ===
		ZeT.assert(parseInt(x) === i)
	}))


	//--> each object key

	var E = { a: { x: 'a' }, b: { x: 2 }, c: { x: 'c' }}

	ZeT.assert('abc' === ZeT.cati(0, ZeT.each(E, function(x, k)
	{
		ZeT.assert(E[k] === x)
	})))

	ZeT.assert('b' === ZeT.each(E, function(x, k)
	{
		if(x.x !== k) return false
	}))


	//--> map (property, index, function)

	var X = [ { x: 'a' }, { x: 2 }, { x: 'b' } ]
	ZeT.assert(ZeTA.eq(['a', 2, 'b'], ZeT.map(X, 'x')))

	var Y = [[ '?', 'a' ], [ '!', 2 ], [ '#', 'b' ]]
	ZeT.assert(ZeTA.eq(['a', 2, 'b'], ZeT.map(Y, 1)))

	ZeT.assert(ZeTA.eq(['a', 'b'], ZeT.map(X, function(x, i)
	{
		ZeT.assert(x == this)
		ZeT.assert(ZeT.isi(i))
		return ZeT.iss(x.x)?(x.x):(undefined)
	})))
}

function testDeepAssign()
{
	var ZeT = JsX.once('zet/extends.js')

	function deepAssign(obj, src, ps, check)
	{
		ZeT.assert(obj == ZeT.deepAssign(obj, src, ps))
		ZeT.assert(check == ZeT.o2s(obj))
	}

	deepAssign( {},
		{ one: 1, b: 'two', three: 3 },
		[ 'none' ], '{}'
	)

	deepAssign( {},
		{ one: 1, b: 'two', three: 3 },
		[ 'one', 'b' ],
		'{"one":1,"b":"two"}'
	)

	deepAssign( { one: { a: 1, be: 2 }},
		{ one: {}, b: 'two', three: 3 },
		[ 'one', 'b' ],
		'{"one":{"a":1,"be":2},"b":"two"}'
	)

	deepAssign( { one: { a: 1, be: {} }},
		{ one: { be: 'two' }, b: 'two', three: 3 },
		[ 'one.be', 'b' ],
		'{"one":{"a":1,"be":"two"},"b":"two"}'
	)

	deepAssign( { one: { a: 1, be: { a: '!' } }},
		{ one: { be: { x: 'xyz' }}, b: 'two', three: 3 },
		[ 'one.be', 'b' ],
		'{"one":{"a":1,"be":{"a":"!"}},"b":"two"}'
	)

	deepAssign( { one: { a: 1, be: { a: '!' } }},
		{ one: { be: { x: 'xyz' }}, b: 'two', three: 3 },
		[ 'one.be.x', 'b' ],
		'{"one":{"a":1,"be":{"a":"!","x":"xyz"}},"b":"two"}'
	)
}

function testClasses()
{
	var ZeT = JsX.once('zet/classes.js')

	//--> native function-class Root

	function Root(a)
	{
		this.n = a
	}

	Root.prototype.calc = function(a)
	{
		return this.n + a
	}

	var root = new Root(10)
	ZeT.assert(root.n == 10)
	ZeT.assert(root.calc(5) == 15)


	//--> ZeT Class One -> Root

	var One = ZeT.Class(Root, {

		init: function(a)
		{
			this.$applySuper(arguments)
		},

		calc: function(a)
		{
			return this.$applySuper(arguments)
		}
	})

	var one = new One(1) //~> n = 1
	ZeT.assert(one.n == 1)
	ZeT.assert(one.calc(10) == 11) //~> 1 + 10


	//--> ZeT Class Two -> One

	var Two = ZeT.Class(One, {

		//!: init() is missing here...

		calc: function(a, b)
		{
			var x = this.$applySuper(arguments)
			return b + x //= b + (n + a)
		}
	})

	var two = new Two(1) //~> n = 1
	ZeT.assert(two.n == 1)
	ZeT.assert(two.calc(2, 3) == 6) //~> 3 + (1 + 2)

	var Three = ZeT.Class(Two, {

		init: function(a, b)
		{
			var self = this

			function outer(x)
			{
				function inner(y)
				{
					self.$callSuper(y)
					return a - self.n
				}

				return x + inner(a)
			}

			this.n = b + outer(a) //= b + a
		}

		//!: calc() is missing here for now...
	})

	var three = new Three(1, 2) //~> n = 3
	ZeT.assert(three.n == 3)
	ZeT.assert(three.calc(2, 3) == 8) //~> 3 + (3 + 2)

	//!: rewrite One.calc()
	One.addMethod('calc', function(a)
	{
		return this.n + a*2
	})

	ZeT.assert(one.calc(10) == 21) //~> 1 + 20
	ZeT.assert(two.calc(2, 3) == 8) //~> 3 + (1 + 2*2)
	ZeT.assert(three.calc(2, 3) == 10) //~> 3 + (3 + 2*2)

	var FourBody = {

		init: function(a, b, c)
		{
			this.$applySuper(arguments)
			this.n += c
		},

		calc: function(a, b, c)
		{
			//= 3*(b + (n + a*2)) + c
			var x = this.$applySuper(arguments)
			return 3*x + c
		}
	}

	var Four = ZeT.Class(Three, FourBody)

	var four = Four.create(1, 2, 3) //~> n = 6
	ZeT.assert(four.n == 6)
	ZeT.assert(four.calc(4, 5, 7) == 64) //~> 3*(5 + (6 + 4*2)) + 7

	//!: inject Three.calc()
	Three.addMethod('calc', function(a, b, c)
	{
		var x = this.$applySuper(arguments)
		return x - c //= (b + (n + a*2)) - c
	})

	ZeT.assert(three.calc(2, 5, 7) == 5) //~> (5 + (3 + 2*2)) - 7
	ZeT.assert(four.calc(2, 5, 7) == 31) //~> 3*(5 + (6 + 2*2) - 7) + 7
}

function testClassDefs()
{
	var ZeT  = JsX.once('zet/classes.js')
	var ZeTS = JsX.once('zet/strings.js')

	ZeT.define('Ya', {})


	//--> plain class-function

	function Root(x, y)
	{
		ZeT.extend(this, { a: 'a', b: 'b', x: x, y: y })
	}

	ZeT.extend(Root.prototype,
		{
			toString : function()
			{
				return ZeTS.cat(this.a, this.x , this.getY(), this.b)
			},

			getY : function()
			{
				return this.y
			}
		})

	var root = new Root('+')
	ZeT.assert('a+b' == root)


	//--> empty class definition

	ZeT.defineClass('Ya.A')
	ZeT.assert(ZeT.isclass(ZeT.defined('Ya.A')))


	//--> simple class definition

	ZeT.defineClass('Ya.B', Root)
	ZeT.assert(ZeT.isclass(ZeT.defined('Ya.B')))
	var b = ZeT.createInstance('Ya.B', '+', '=')
	ZeT.assert('a+=b' == b)


	//--> class definition with body

	ZeT.defineClass('Ya.C', 'Ya.B',
		{
			getY : function()
			{
				return this.y || ZeT.get(this, '$class', 'static', 'y')
			}
		})

	var c = ZeT.createInstance('Ya.C', ':')
	ZeT.assert('a:b' == c)


	//--> extend class

	ZeT.extendClass('Ya.C', { y: '!' })
	ZeT.assert('a:!b' == c)


	//--> define instance

	ZeT.defineInstance('Ya.cc', 'Ya.C', '+')
	ZeT.assert('a+!b' == ZeT.defined('Ya.cc'))


	var YcBody = {

		init : function()
		{
			this.z = arguments[2]
			this.$applySuper(arguments)
		},

		getY : function()
		{
			return ZeTS.cat(this.z, this.$applySuper())
		}
	}


	//--> single instance

	ZeT.singleInstance('Ya.$c', 'Ya.C', YcBody, '+', '-', '?')
	ZeT.assert('a+?-b' == ZeT.defined('Ya.$c'))


	//--> hidden instance

	var Yaz = ZeT.hiddenInstance('Ya.C', YcBody, '+', '-', '?')
	ZeT.assert('a+?-b' == Yaz)

	var Yaw = ZeT.hiddenInstance('Ya.C', ['+', '-', '?'], YcBody)
	ZeT.assert('a+?-b' == Yaw)
}

function testConsole()
{
	var ZeT = JsX.include('zet/console.js')

	ZeT.Console.out.print('This is ', 0, '-sample!')
	ZeT.Console.out.println(' Did you here ', [1, 2, 3], '?')

	ZeT.Console.err.println('This ', 'is a sound', ' of ', 'error...')
}

function testLinkedMap()
{
	var ZeT = JsX.include('zet/map.js')

	var seed = 2147483647; function rnd(n)
	{
		seed = (1664525 * seed + 1013904223) % 4294967296
		return ZeT.isi(n)?(seed % n):(seed < 2147483648)
	}

	function check(a, m)
	{
		ZeT.assert(a.length === m.size)

		var i = 0; m.each(function(v, k)
		{
			ZeT.assert(v == this)
			ZeT.assert(('$' + a[i]) === k, ' a[ ', i, '] = ', a[i], ' ', k)
			ZeT.assert(('!' + a[i]) === v)
			i++
		})

		ZeT.assert(a.length == i)

		i = a.length - 1; m.reverse(function(v, k)
		{
			ZeT.assert(v == this)
			ZeT.assert(('$' + a[i]) === k)
			ZeT.assert(('!' + a[i]) === v)
			i--
		})

		ZeT.assert(-1 == i)
	}

	function yes(a, m, k)
	{
		ZeT.assert(a.length === m.size)
		ZeT.assert(a.indexOf(k) >= -1)
		ZeT.assert(m.contains('$' + k))
		ZeT.assert(ZeT.isi(m.index('$' + k)))
		ZeT.assert(('!' + k) === m.get('$' + k))
	}

	function no(a, m, k)
	{
		ZeT.assert(a.length === m.size)
		ZeT.assert(a.indexOf(k) == -1)
		ZeT.assert(!m.contains('$' + k))
		ZeT.assert(ZeT.isu(m.index('$' + k)))
		ZeT.assert(ZeT.isu(m.get('$' + k)))
	}

	function put(a, m, k)
	{
		no(a, m, k)

		a.push(k)
		m.put('$' + k, '!' + k)

		yes(a, m, k)
	}

	function del(a, m, k)
	{
		yes(a, m, k)

		a.splice(a.indexOf(k), 1)
		ZeT.assert(('!' + k) === m.remove('$' + k))

		no(a, m, k)
	}

	function put2(a, m, k)
	{
		yes(a, m, k)

		a.splice(a.indexOf(k), 1)
		a.push(k)

		ZeT.assert(('!'  + k) === m.put('$' + k, '!?' + k))
		ZeT.assert(('!?' + k) === m.put('$' + k, '!'  + k))

		yes(a, m, k)
	}

	for(var test = 0;(test < 10);test++)
	{
		var a = [], m = new ZeT.Map()
		var n = 1 + rnd(25)

		for(var i = 0;(i < n*4);i++) try
		{
			var k = rnd(Math.floor(n))

			check(a, m)

			//?: {not contains key}
			if(a.indexOf(k) == -1)
				put(a, m, k)
			//?: {contains, do remove}
			else if(rnd())
				del(a, m, k)
			//?: {contains, repeat put}
			else
				put2(a, m, k)
		}
		catch(e)
		{
			ZeT.log('testLinkedMap() failed at test [',
			        test, '] index [', i, ']: ', a, m)

			throw e
		}
	}
}