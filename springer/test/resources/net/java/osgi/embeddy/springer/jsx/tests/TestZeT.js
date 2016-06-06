/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                                                               |
 |                          Test Cases                           |
 |                                                               |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

function helloWorld()
{
	print('Hello, World!')
}

function testChecks()
{
	var ZeT = JsX.include('zet/asserts.js')

	//?: {not ZeT}
	if(ZeT !== JsX.global('ZeT'))
		throw new Error('asserts.js returned not ZeT!')

	//--> is strings

	ZeT.assert(ZeT.iss(''))
	ZeT.assert(ZeT.iss('abc'))
	ZeT.assert(ZeT.iss('1.0'))
	ZeT.assert(!ZeT.iss(true))
	ZeT.assert(!ZeT.iss({}))
	ZeT.assert(!ZeT.iss(1.0))
	ZeT.assert(!ZeT.iss(null))
	ZeT.assert(!ZeT.iss(undefined))

	//--> is functions

	ZeT.assert(ZeT.isf(helloWorld))
	ZeT.assert(!ZeT.isf(true))
	ZeT.assert(!ZeT.isf(''))
	ZeT.assert(!ZeT.isf({}))
	ZeT.assert(!ZeT.isf(1.0))
	ZeT.assert(!ZeT.isf(null))
	ZeT.assert(!ZeT.isf(undefined))

	//--> is boolean

	ZeT.assert(ZeT.isb(true))
	ZeT.assert(ZeT.isb(false))
	ZeT.assert(ZeT.isb(true && false))
	ZeT.assert(!ZeT.isb(helloWorld))
	ZeT.assert(!ZeT.isb(''))
	ZeT.assert(!ZeT.isb({}))
	ZeT.assert(!ZeT.isb(1.0))
	ZeT.assert(!ZeT.isb(null))
	ZeT.assert(!ZeT.isb(undefined))

	//--> is undefined

	ZeT.assert(ZeT.isu(undefined))
	ZeT.assert(!ZeT.isu(null))
	ZeT.assert(!ZeT.isu(true))
	ZeT.assert(!ZeT.isu(helloWorld))
	ZeT.assert(!ZeT.isu(''))
	ZeT.assert(!ZeT.isu({}))
	ZeT.assert(!ZeT.isu(1.0))

	//--> is array

	ZeT.assert(ZeT.isa([]))
	ZeT.assert(ZeT.isa([1, 2, 3]))
	ZeT.assert(ZeT.isa(new Array(10)))
	ZeT.assert(!ZeT.isa(null))
	ZeT.assert(!ZeT.isa(undefined))
	ZeT.assert(!ZeT.isa(true))
	ZeT.assert(!ZeT.isa(helloWorld))
	ZeT.assert(!ZeT.isa(''))
	ZeT.assert(!ZeT.isa({}))
	ZeT.assert(!ZeT.isa(1.0))

	//--> is numbers

	ZeT.assert(ZeT.isn(0))
	ZeT.assert(ZeT.isi(0))
	ZeT.assert(ZeT.isn(1.1))
	ZeT.assert(!ZeT.isn({}))
	ZeT.assert(!ZeT.isn('1'))
	ZeT.assert(ZeT.isi(101))
	ZeT.assert(!ZeT.isi(10.1))
	ZeT.assert(!ZeT.isi('10'))
	ZeT.assert(!ZeT.isi({}))

	//--> is object

	ZeT.assert(ZeT.iso({}))
	ZeT.assert(ZeT.iso({a: 'a', b: true, c: {}}))
	ZeT.assert(ZeT.iso(new Object()))
	ZeT.assert(!ZeT.iso(null))
	ZeT.assert(!ZeT.iso(undefined))
	ZeT.assert(!ZeT.iso(true))
	ZeT.assert(!ZeT.iso(helloWorld))
	ZeT.assert(!ZeT.iso('abc'))
	ZeT.assert(!ZeT.iso([]))
	ZeT.assert(!ZeT.iso(1.0))
	ZeT.assert(!ZeT.iso(0))
	ZeT.assert(!ZeT.iso(10))
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

		throw new Error('Assertion ' + a +
		  ' didn\'t throw error on [' + args + ']!')
	}

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

	//--> assert not empty array

	test(ZeT.asserta, null)
	test(ZeT.asserta, undefined)
	test(ZeT.asserta, [])
	test(ZeT.asserta, new Array(4))
	test(ZeT.asserta, {0: 'a', 1: 1.0})
	ZeT.asserta([null])
	ZeT.asserta([0, 1])

	//--> assert not whitespace-empty string

	test(ZeT.asserts, null)
	test(ZeT.asserts, undefined)
	test(ZeT.asserts, '')
	test(ZeT.asserts, '  ')
	test(ZeT.asserts, ' \t  \r\n ')
	ZeT.asserts('abc')
	ZeT.asserts('ab c ')
	ZeT.asserts('ab c \n')
}

function testArrays()
{
	var ZeT  = JsX.include('zet/asserts.js')
	var ZeTA = JsX.include('zet/arrays.js')

	//?: {not ZeT arrays}
	if(ZeTA !== JsX.global('ZeTA'))
		throw new Error('arrays.js returned not ZeTA!')

	//--> equals

	ZeT.assert(ZeTA.eq([], []))
	ZeT.assert(ZeTA.eq([1, 2, 3], [1, 2, 3]))
	ZeT.assert(!ZeTA.eq([2, 1, 3], [1, 2, 3]))
	ZeT.assert(ZeTA.eq('abc', "abc"))
	ZeT.assert(!ZeTA.eq('abc', "aBc"))
	ZeT.assert(ZeTA.eq('abc', ['a', 'b', 'c']))

	//--> array-like

	var A = { length: 3, 0: 'a', 1: 'b', 2: 'c' }
	ZeT.assert(ZeT.isa(ZeTA.a(A)))
	ZeT.assert(ZeTA.eq(ZeTA.a(A), ['a', 'b', 'c']))

	//--> copy

	var B = [0, 1, 2, 3, 4, 5]
	ZeT.assert(ZeTA.copy(B) !== B)
	ZeT.assert(ZeTA.eq(ZeTA.copy(B), B))
	ZeT.assert(ZeTA.eq(ZeTA.copy(B, 3), [3, 4, 5]))
	ZeT.assert(ZeTA.eq(ZeTA.copy(B, 2, 6), [2, 3, 4, 5]))
	ZeT.assert(ZeTA.eq(ZeTA.copy(B, 2, 4), [2, 3]))

	//--> delete

	ZeT.assert(ZeTA.eq(B, ZeTA.remove(ZeTA.copy(B))))
	ZeT.assert(ZeTA.eq([1, 5], ZeTA.remove(ZeTA.copy(B), 0, 2, 3, 4)))
	ZeT.assert(ZeTA.eq([1, 5], ZeTA.remove(ZeTA.copy(B), [0, 2, 3, 4])))
	ZeT.assert(ZeTA.eq([1, 5], ZeTA.remove(ZeTA.copy(B), [0, 2], [3, 4])))
	ZeT.assert(ZeTA.eq([0, 1, 5], ZeTA.remove.call(ZeTA.copy(B), 2, 3, 4)))
	ZeT.assert(ZeTA.eq([0, 1, 5], ZeTA.remove.call(ZeTA.copy(B), [2], [3, 4])))

	//--> merge

	ZeT.assert(ZeTA.eq([], ZeTA.concat([], [])))
	ZeT.assert(ZeTA.eq(B, ZeTA.concat([0, 1, 2], [3, 4, 5])))
	ZeT.assert(ZeTA.eq(B, ZeTA.concat([0, 1], B, 2)))
	ZeT.assert(ZeTA.eq([0, 1, 3, 4], ZeTA.concat([0, 1], B, 3, 5)))
}

function testBasicsObject()
{
	var ZeT = JsX.include('zet/basics.js')

	//?: {not ZeT}
	if(ZeT !== JsX.global('ZeT'))
		throw new Error('basics.js returned not ZeT!')

	function ks(obj)
	{
		return ZeT.keys(obj).join('')
	}

	//--> keys

	ZeT.assert('a2c' == ['a', 2, 'c'].join(''))
	ZeT.assert('abc' == ks({ a: 'a', b: 2, c: "c" }))

	//--> extend

	var A = { a: 'a', b: 'b' }
	ZeT.assert('ab' == ks(A))

	var B = ZeT.extend(A, { c: 'x', d: 'y' })
	ZeT.assert(A === B)
	ZeT.assert('abcd' == ks(A))
	ZeT.assert(A.a === 'a' && A.d === 'y')

	//--> deep clone

	function Xu(obj)
	{
		ZeT.extend(this, obj)
	}

	ZeT.extend(Xu.prototype, { x: 1, y: 2 })

	A = new Xu({ a: 'a', b: { c: 'c', d: 'd' }})
	ZeT.assert('ab' == ks(A))
	ZeT.assert('cd' == ks(A.b))
	ZeT.assert(Object.getPrototypeOf(A).x === 1)
	ZeT.assert(A.x === 1 && A.y === 2)

	B = ZeT.deepClone(A)
	ZeT.assert(A != B)
	ZeT.assert('ab' == ks(B))
	ZeT.assert(A.b != B.b)
	ZeT.assert('cd' == ks(B.b))
	ZeT.assert(B.b.c === 'c' && B.b.d === 'd')
	ZeT.assert(B.x === 1 && B.y === 2)

	//--> deep extend

	var C = ZeT.deepExtend(B, { x: 'x', b: { c: 1, e: { f: 'f', g: 'g' }}})

	ZeT.assert(C === B)
	ZeT.assert(B.x === 1)
	ZeT.assert('ab' == ks(B))
	ZeT.assert(B.b.c === 'c')
	ZeT.assert('cde' == ks(B.b))
	ZeT.assert('fg' == ks(B.b.e))
	ZeT.assert(B.b.e.f === 'f' && B.b.e.g === 'g')
}

function testBasicsFunction()
{
	var ZeT  = JsX.include('zet/basics.js')
	var ZeTA = JsX.global('ZeTA')

	function xyz()
	{
		var r = ZeT.isn(this)?(this):(0)

		for(var i = 0;(i < arguments.length);i++)
			if(ZeT.isn(arguments[i]))
				r += ((i%2 == 0)?(+1):(-1)) * arguments[i]

		return r
	}

	ZeT.assert(4 == xyz.call(1, 2, 3, 4))

	//--> function bind

	var f = ZeT.fbind(xyz, -3)
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

	//--> functions pipe

	function sum()
	{
		ZeT.assert(ZeT.isn(this))
		var a = ZeT.a(arguments)
		for(var i = 0;(i < a.length);i++)
		{
			ZeT.assert(ZeT.isn(a[i]))
			a[i] += this
		}
		return a
	}

	ZeT.assert(ZeTA.eq([11, 12, 13], sum.call(10, 1, 2, 3)))

	function mul()
	{
		ZeT.assert(ZeT.isn(this))
		var a = ZeT.a(arguments)
		for(var i = 0;(i < a.length);i++)
		{
			ZeT.assert(ZeT.isn(a[i]))
			a[i] *= this
		}
		return a
	}

	ZeT.assert(ZeTA.eq([3, 6, 9], mul.call(3, 1, 2, 3)))

	function neg()
	{
		var a = ZeT.a(arguments)
		for(var i = 0;(i < a.length);i++)
		{
			ZeT.assert(ZeT.isn(a[i]))
			a[i] = -a[i]
		}
		return a
	}

	ZeT.assert(ZeTA.eq([-1, 2, -3], neg(1, -2, 3)))

	f = ZeT.pipe(sum)
	ZeT.assert(ZeTA.eq([11, 12, 13], f.call(10, 1, 2, 3)))

	f = ZeT.pipe(sum, mul, neg)
	ZeT.assert(ZeTA.eq([+2, 0, -2], f.call(2, -3, -2, -1)))
}

function testBasicsHelper()
{
	var ZeT  = JsX.include('zet/basics.js')
	var ZeTA = JsX.global('ZeTA')

	//--> each

	ZeT.each(['0', '1', '2', '3'], function(x, i)
	{
		//WARNING: here this somehow becomes an object!
		ZeT.assert(x == this)
		ZeT.assert(parseInt(x) === i)
	})

	//--> evaluate in function

	ZeT.assert('abc' === ZeT.xeval("return 'abc'"))
	ZeT.assert(3 === ZeT.xeval("return 1 + 2"))

	//--> collect property

	var A = [ { x: 'a' }, { x: 2 }, { x: 'b' } ]
	ZeT.assert(ZeTA.eq(['a', 2, 'b'], ZeT.collect(A, 'x')))

	//--> collect function

	ZeT.assert(ZeTA.eq(['a', 'b'], ZeT.collect(A, function(x, i)
	{
		ZeT.assert(x == this)
		ZeT.assert(ZeT.isi(i))

		if(!ZeT.iss(x.x)) return undefined
		return x.x
	})))
}

function testStrings()
{
	var ZeT  = JsX.include('zet/asserts.js')
	var ZeTS = JsX.include('zet/strings.js')

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
	ZeT.assert(ZeTS.cati(2, 'abc', null, '-> ', O) == '-> !')

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
}

function testClasses()
{
	var ZeT = JsX.include('zet/classes.js')

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

	var fourX = ZeT.Instance(Three, FourBody, 1, 2, 3)
	ZeT.assert(fourX.n == 6)
	ZeT.assert(fourX.calc(4, 5, 7) == 64) //~> same as four

	//!: inject Three.calc()
	Three.addMethod('calc', function(a, b, c)
	{
		var x = this.$applySuper(arguments)
		return x - c //= (b + (n + a*2)) - c
	})

	ZeT.assert(three.calc(2, 5, 7) == 5) //~> (5 + (3 + 2*2)) - 7
	ZeT.assert(four.calc(2, 5, 7) == 31) //~> 3*(5 + (6 + 2*2) - 7) + 7
	ZeT.assert(fourX.calc(2, 5, 7) == 31) //~> same as four
}

function testConsole()
{
	var ZeT = JsX.include('zet/console.js')

	ZeT.Console.out.print('This is ', 0, '-sample!')
	ZeT.Console.out.println(' Did you here ', [1, 2, 3], '?')

	ZeT.Console.err.println('This ', 'is a sound', ' of ', 'error...')
}