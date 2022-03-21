var documenterSearchIndex = {"docs":
[{"location":"experimental/#Experimental","page":"Experimental","title":"Experimental","text":"","category":"section"},{"location":"experimental/","page":"Experimental","title":"Experimental","text":"TryExperimental.Result","category":"page"},{"location":"experimental/#TryExperimental.Result","page":"Experimental","title":"TryExperimental.Result","text":"Result{T,E}\n\n\n\n\n\n","category":"type"},{"location":"experimental/#customize-short-circuit","page":"Experimental","title":"Customizing short-circuit evaluation","text":"","category":"section"},{"location":"experimental/","page":"Experimental","title":"Experimental","text":"TryExperimental.branch\nTryExperimental.Break\nTryExperimental.Continue\nTryExperimental.resultof\nTryExperimental.valueof","category":"page"},{"location":"experimental/#TryExperimental.branch","page":"Experimental","title":"TryExperimental.branch","text":"TryExperiment.branch(result) -> Continue(result)\nTryExperiment.branch(result) -> Break(result)\n\nbranch implements a short-circuiting evaluation API.  It must return a Continue or a Break.\n\n\n\n\n\n","category":"function"},{"location":"experimental/#TryExperimental.Break","page":"Experimental","title":"TryExperimental.Break","text":"TryExperimental.Break(result)\n\n\n\n\n\n","category":"type"},{"location":"experimental/#TryExperimental.Continue","page":"Experimental","title":"TryExperimental.Continue","text":"TryExperimental.Continue(result)\n\n\n\n\n\n","category":"type"},{"location":"experimental/#TryExperimental.resultof","page":"Experimental","title":"TryExperimental.resultof","text":"TryExperimental.resultof(branch) -> result \nTryExperimental.resultof(branch::Continue{<:Ok}) ->  result::Ok\nTryExperimental.resultof(branch::Break{<:Err}) ->  result::Err\nTryExperimental.resultof(branch::Continue{<:Some}) ->  result::Some\nTryExperimental.resultof(branch::Break{Nothing}) -> nothing\n\n\n\n\n\n","category":"function"},{"location":"experimental/#TryExperimental.valueof","page":"Experimental","title":"TryExperimental.valueof","text":"TryExperimental.valueof(branch) -> value\nTryExperimental.valueof(branch::Continue{Ok{T}}) -> value::T\nTryExperimental.valueof(branch::Break{Err{T}}) -> value::T\nTryExperimental.valueof(branch::Continue{Some{T}}) -> value::T\nTryExperimental.valueof(branch::Break{Nothing}) -> nothing\n\n\n\n\n\n","category":"function"},{"location":"#Try.jl","page":"Try.jl","title":"Try.jl","text":"","category":"section"},{"location":"","page":"Try.jl","title":"Try.jl","text":"Try\nOk\nErr","category":"page"},{"location":"#Try","page":"Try.jl","title":"Try","text":"Try.jl: zero-overhead and debuggable error handling\n\nFeatures:\n\nError handling as simple manipulations of values.\nFocus on inferrability and optimizability leveraging unique properties of the Julia language and compiler.\nError trace for determining the source of errors, without throw.\nFacilitate the \"Easier to ask for forgiveness than permission\" (EAFP) approach as a robust and minimalistic alternative to the trait-based feature detection.\n\nFor more explanation, see Discussion below.\n\nExamples\n\nBasic usage\n\njulia> using Try\n\njulia> using TryExperimental  # exports trygetindex etc.\n\nTry.jl-based API return either an OK value\n\njulia> ok = trygetindex(Dict(:a => 111), :a)\nTry.Ok: 111\n\nor an Err value:\n\njulia> err = trygetindex(Dict(:a => 111), :b)\nTry.Err: KeyError: key :b not found\n\nTogether, these values are called result values.  Try.jl provides various tools to deal with the result values such as predicate functions:\n\njulia> Try.isok(ok)\ntrue\n\njulia> Try.iserr(err)\ntrue\n\nunwrapping function:\n\njulia> Try.unwrap(ok)\n111\n\njulia> Try.unwrap_err(err)\nKeyError(:b)\n\nand more.\n\nError trace\n\nConsider an example where an error \"bubbles up\" from a deep stack of function calls:\n\njulia> using Try, TryExperimental\n\njulia> f1(x) = x ? Ok(nothing) : Err(KeyError(:b));\n\njulia> f2(x) = f1(x);\n\njulia> f3(x) = f2(x);\n\nSince Try.jl represents an error simply as a Julia value, there is no information on the source this error:\n\njulia> f3(false)\nTry.Err: KeyError: key :b not found\n\nWe can enable the stacktrace recording of the error by calling  Try.enable_errortrace().\n\njulia> Try.enable_errortrace();\n\njulia> y = f3(false)\nTry.Err: KeyError: key :b not found\nStacktrace:\n [1] f1\n   @ ./REPL[2]:1 [inlined]\n [2] f2\n   @ ./REPL[3]:1 [inlined]\n [3] f3(x::Bool)\n   @ Main ./REPL[4]:1\n [4] top-level scope\n   @ REPL[7]:1\n\njulia> Try.disable_errortrace();\n\nNote that f3 didn't throw an exception. It returned a value of type Err:\n\njulia> Try.iserr(y)\ntrue\n\njulia> Try.unwrap_err(y)\nKeyError(:b)\n\nThat is to say, the stacktrace is simply attached as \"metadata\" and Try.enable_errortrace() does not alter how Err values behave.\n\nLimitation/implementation details: To eliminate the cost of stacktrace capturing when it is not used, Try.enable_errortrace() is implemented using method invalidation. Thus, error trace cannot be enabled for Tasks that have been already started.\n\nEAFP\n\nAs explained in EAFP and traits below, the Base-like API defined in TryExperimental does not throw when the method is not defined.  For example, trygeteltype and trygetlength can be called on arbitrary objects (= \"asking for forgiveness\") without checking if the method is defined (= \"asking for permission\").\n\nusing Try, TryExperimental\n\nfunction try_map_prealloc(f, xs)\n    T = @? trygeteltype(xs)  # macro-based short-circuiting\n    n = @? trygetlength(xs)\n    ys = Vector{T}(undef, n)\n    for (i, x) in zip(eachindex(ys), xs)\n        ys[i] = f(x)\n    end\n    return Ok(ys)\nend\n\nmymap(f, xs) =\n    try_map_prealloc(f, xs) |>\n    Try.or_else() do _  # functional composition\n        Ok(mapfoldl(f, push!, xs; init = []))\n    end |>\n    Try.unwrap\n\nmymap(x -> x + 1, 1:3)\n\n# output\n3-element Vector{Int64}:\n 2\n 3\n 4\n\nmymap(x -> x + 1, (x for x in 1:5 if isodd(x)))\n\n# output\n3-element Vector{Any}:\n 2\n 4\n 6\n\nSuccess/failure path elimination\n\nFunction using Try.jl for error handling (such as Try.first) typically has a return type of Union{Ok,Err}. Thus, the compiler can sometimes prove that success or failure paths can never be taken:\n\njulia> using TryExperimental, InteractiveUtils\n\njulia> @code_typed(trygetfirst((111, \"two\", :three)))[2]  # always succeeds for non empty tuples\nOk{Int64}\n\njulia> @code_typed(trygetfirst(()))[2]  # always fails for an empty tuple\nErr{BoundsError}\n\njulia> @code_typed(trygetfirst(Int[]))[2]  # both are possible for an array\nUnion{Ok{Int64}, Err{BoundsError}}\n\nConstraining returnable errors\n\nWe can use the return type conversion function f(...)::ReturnType ...  end to constrain possible error types. This is similar to the throws keyword in Java.\n\nThis can be used for ensuring that only the expected set of errors are returned from Try.jl-based functions.  In particular, it may be useful for restricting possible errors at an API boundary.  The idea is to separate \"call API\" f from \"overload API\" __f__ such that new methods are added to __f__ and not to f.  We can then wrap the overload API function by the call API function that simply declare the return type:\n\nf(args...)::Result{Any,PossibleErrors} = __f__(args...)\n\n(Using type assertion as in __f__(args...)::Result{Any,PossibleErrors} also works in this case.)\n\nThen, the API specification of f can include the overloading instruction explaining that method of __f__ should be defined and enumerate allowed set of errors.\n\nHere is an example of providing the call API tryparse with the overload API __tryparse__ wrapping Base.tryparase.  In this toy example, __tryparse__ can return InvalidCharError() or EndOfBufferError() as an error value:\n\nusing Try, TryExperimental\n\nconst Result{T,E} = Union{Ok{<:T},Err{<:E}}\n# using TryExperimental: Result  # (almost equivalent)\n\nstruct InvalidCharError <: Exception end\nstruct EndOfBufferError <: Exception end\n\nconst ParseError = Union{InvalidCharError, EndOfBufferError}\n\ntryparse(T, str)::Result{T,ParseError} = __tryparse__(T, str)\n\nfunction __tryparse__(::Type{Int}, str::AbstractString)\n    isempty(str) && return Err(EndOfBufferError())\n    Ok(@something(Base.tryparse(Int, str), return Err(InvalidCharError())))\nend\n\ntryparse(Int, \"111\")\n\n# output\nTry.Ok: 111\n\ntryparse(Int, \"\")\n\n# output\nTry.Err: EndOfBufferError()\n\ntryparse(Int, \"one\")\n\n# output\nTry.Err: InvalidCharError()\n\nConstraining errors can be useful for generic programming if it is desirable to ensure that error handling is complete.  This pattern makes it easy to report invalid errors directly to the programmer (see When to throw? When to return?) while correctly implemented methods do not incur any run-time overheads.\n\nSee also: julep: \"chain of custody\" error handling · Issue #7026 · JuliaLang/julia\n\nDiscussion\n\nJulia is a dynamic language with a compiler that can aggressively optimize away the dynamism to get the performance comparable static languages.  As such, many successful features of Julia provide the usability of a dynamic language while paying attentions to the optimizability of the composed code.  However, native throw/catch-based exception is not optimized aggressively and existing \"static\" solutions do not support idiomatic high-level style of programming. Try.jl explores an alternative solution embracing the dynamism of Julia while restricting the underlying code as much as possible to the form that the compiler can optimize away.\n\nDynamic returned value types for maximizing optimizability\n\nTry.jl provides an API inspired by Rust's Result type.  However, to fully unlock the power of Julia, Try.jl uses the small Union types instead of a concretely typed struct type.  This is essential for idiomatic clean high-level Julia code that avoids computing output type manually.  However, all previous attempts in this space (such as ErrorTypes.jl, ResultTypes.jl, and Expect.jl) use a struct type for representing the result value (see ErrorTypes.Result, ResultTypes.Result, and Expect.Expected). Using a concretely typed struct as returned type has some benefits in that it is easy to control the result of type inference.  However, this forces the user to manually compute the type of the untaken paths.  This is tedious and sometimes simply impossible.  This is also not idiomatic Julia code which typically delegates output type computation to the compiler.  Futhermore, the benefit of type-stabilization is at the cost of loosing the opportunity for the compiler to eliminate the success and/or failure branches (see Success/failure path elimination above).  A similar optimization can still happen in principle with the concrete struct approach with the combination of (post-inference) inlining, scalar replacement of aggregate, and dead code elimination.  However, since type inference is the main driving force in the inter-procedural analysis and optimization in the Julia compiler, Union return type is likely to continue to be the most effective way to communicate the intent of the code with the compiler (e.g., if a function call always succeeds, always return an Ok{T}).\n\n(That said, Try.jl also contains supports for concretely-typed returned value when Union is not appropriate. This is for experimenting if such a manual \"type-instability-hiding\" is a viable approach at a large scale and if providing a uniform API is possible.)\n\nDebuggable error handling\n\nA potential usability issue for using the Result type is that the detailed context of the error is lost by the time the user received an error.  This makes debugging Julia programs hard compared to simply throwing the exception.  To mitigate this problem, Try.jl provides an error trace mechanism for recording the backtrace of the error.  This can be toggled using Try.enable_errortrace() at the run-time.  This is inspired by Zig's Error Return Traces.\n\nEAFP and traits\n\nTry.jl exposes a limited set of \"verbs\" based on Julia Base such as Try.take!.  These functions have a catch-all default definition that returns an error value of type Err{NotImplementedError}.  This let us use these functions in the \"Easier to ask for forgiveness than permission\" (EAFP) manner because they can be called without getting the run-time MethodError exception. Importantly, the EAFP approach does not have the problem of the trait-based feature detection where the implementer must ensure that declared trait (e.g., HasLength) is compatible with the actual definition (e.g., length).  With the EAFP approach, the feature is declared automatically by defining of the method providing it (e.g., trygetlength).  Thus, by construction, it is hard to make the feature declaration and definition out-of-sync.  Of course, this approach works only for effect-free or \"redo-able\" functions.  To check if a sequence of destructive operations is possible, the trait-based approach is perhaps unavoidable.  Therefore, these approaches are complementary.  The EAFP-based strategy is useful for reducing the complexity of library extension interface.\n\n(Usage notes: An \"EAFP-compatible\" function can be declared with Try.@function f instead of function f end.  It automatically defines a catch-all fallback method that returns an Err{<:NotImplementedError}.)\n\nSide notes on hasmethod and applicable (and invoke)\n\nNote that the EAFP approach using Try.jl is not equivalent to the \"Look before you leap\" (LBYL) counterpart using hasmethod and/or applicable.  That is to say, checking applicable(f, x) before calling f(x) may look attractive as it can be done without any building blocks.  However, this LBYL approach is fundamentally unusable for generic feature detection.  This is because hasmethod and applicable cannot handle \"blanket definition\" with \"internal dispatch\" like this:\n\njulia> f(x::Real) = f_impl(x);  # blanket definition\n\njulia> f_impl(x::Int) = x + 1;  # internal dispatch\n\njulia> applicable(f, 0.1)\ntrue\n\njulia> hasmethod(f, Tuple{Float64})\ntrue\n\nNotice that f(0.1) is considered callable if we trust applicable or hasmethod even though f(0.1) will throw a MethodError.  Thus, unless the overload instruction of f specifically forbids the blanket definition like above, the result of applicable and hasmethod cannot be trusted.  (For exactly the same reason, the use of invoke on library functions is problematic.)\n\nThe EAFP approach works because the actual code path \"dynamically declares\" the feature.\n\nWhen to throw? When to return?\n\nHaving two modes of error reporting (i.e., throwing an exception and  returning an Err value) introduces a complexity that must be justified.  Is Try.jl just a workaround until the compiler can optimize try-catch?   (\"Yes\" may be a reasonable answer.)  Or is there a principled way to distinguish the use cases of them?  (This is what is explored here.)\n\nReporting error by returning an Err value is particularly useful when an error handling occurs in a tight loop.  For example, when composing concurrent data structure APIs, it is sometimes required to know the failure mode (e.g., logical vs temporary/contention failures) in a tight loop. It is likely that Julia compiler can compile this down to a simple flag-based low-level code or a state machine. Note that this style of programming requires a clear definition of the API noting on what conditions certain errors are reported. That is to say, the API ensures the detection of unsatisfied pre-conditions and it is likely that the caller have some ways to recover from the error.\n\nIn contrast, if there is no way for the caller program to recover from the error and the error should be reported to a human, throwing an exception is more appropriate.  For example, if an inconsistency of the internal state of a data structure is detected, it is likely a bug in the usage or implementation. In this case, there is no way for the caller program to recover from such an out-of-contract error and only the human programmer can take an action.  To support typical interactive workflow in Julia, printing an error and aborting the whole program is not an option.  Thus, it is crucial that it is possible to recover even from an out-of-contract error in Julia.  Such a language construct is required for building programming tools such as REPL and editor plugins can use it.  In summary, return-based error reporting is adequate for recoverable errors and throw-based error reporting is adequate for unrecoverable (i.e., programmer's) errors.\n\n\n\n\n\n","category":"module"},{"location":"#Try.Ok","page":"Try.jl","title":"Try.Ok","text":"Ok(value::T) -> ok::Ok{T}\nOk{T}(value) -> ok::Ok{T}\n\n\n\n\n\n","category":"type"},{"location":"#Try.Err","page":"Try.jl","title":"Try.Err","text":"Err(value::E) -> err::Err{E}\nErr{E}(value) -> err::Err{E}\n\n\n\n\n\n","category":"type"},{"location":"#Short-circuit-evaluation","page":"Try.jl","title":"Short-circuit evaluation","text":"","category":"section"},{"location":"","page":"Try.jl","title":"Try.jl","text":"@?\nTry.@and_return\nTry.or_else\nTry.and_then","category":"page"},{"location":"#Try.@?","page":"Try.jl","title":"Try.@?","text":"@? result\n\nEvaluates to an unwrapped \"success\" result value; return result if it is a \"failure.\"\n\nIf result is an Ok or a Some, @? is equivalent to unwrapping the value.  If result is an Err or nothing, @? is equivalent to return.\n\nInvocation Equivalent code\n@? Ok(value) value\n@? Err(value) return value\n@? Some(value) value\n@? nothing return nothing\n\nSee also: @and_return, and_then, or_else.\n\nExtended help\n\nExamples\n\nusing Try, TryExperimental\n\nfunction try_map_prealloc(f, xs)\n    T = @? trygeteltype(xs)  # macro-based short-circuiting\n    n = @? trygetlength(xs)\n    ys = Vector{T}(undef, n)\n    for (i, x) in zip(eachindex(ys), xs)\n        ys[i] = f(x)\n    end\n    return Ok(ys)\nend\n\nTry.unwrap(try_map_prealloc(x -> x + 1, 1:3))\n\n# output\n3-element Vector{Int64}:\n 2\n 3\n 4\n\n\n\n\n\n","category":"macro"},{"location":"#Try.@and_return","page":"Try.jl","title":"Try.@and_return","text":"Try.@and_return result -> result′\n\nEvaluate f(value) if result is a \"success\" wrapping a value; otherwise, a \"failure\" value as-is.\n\nInvocation Equivalent code\n@and_return Ok(value) value\n@and_return err::Err return err\n@and_return Some(value) value\n@and_return nothing return nothing\n\nSee also: @? and_then, or_else.\n\nExtended help\n\nExamples\n\nLet's define a function nitems that works like length but falls back to iteration-based counting:\n\nusing Try, TryExperimental\n\nfunction trygetnitems(xs)\n    Try.@and_return trygetlength(xs)\n    Ok(count(Returns(true), xs))\nend\n\nnitems(xs) = Try.unwrap(trygetnitems(xs))\n\nnitems(1:3)\n\n# output\n3\n\nnitems works with arbitrary iterator, including the ones that does not have length:\n\nch = foldl(push!, 1:3; init = Channel{Int}(3))\nclose(ch)\n\nnitems(ch)\n\n# output\n3\n\n\n\n\n\n","category":"macro"},{"location":"#Try.or_else","page":"Try.jl","title":"Try.or_else","text":"Try.or_else(f, result) -> result′\nTry.or_else(f) -> result -> result′\n\nReturn result as-is if it is a \"successful\" value; otherwise, unwrap a \"failure\" value in result and then evaluate f on it.\n\nInvocation Equivalent code\nor_else(f, ok::Ok) ok\nor_else(f, Err(value)) f(value)\nor_else(f, some::Some) some\nor_else(f, nothing) f(nothing)\n\nSee also: @? @and_return, and_then.\n\nExtended help\n\nExamples\n\nLet's define a function nitems that works like length but falls back to iteration-based counting:\n\nusing Try, TryExperimental\n\nnitems(xs) =\n    Try.or_else(trygetlength(xs)) do _\n        Ok(count(Returns(true), xs))\n    end |> Try.unwrap\n\nnitems(1:3)\n\n# output\n3\n\nnitems works with arbitrary iterator, including the ones that does not have length:\n\nch = foldl(push!, 1:3; init = Channel{Int}(3))\nclose(ch)\n\nnitems(ch)\n\n# output\n3\n\n\n\n\n\n","category":"function"},{"location":"#Try.and_then","page":"Try.jl","title":"Try.and_then","text":"Try.and_then(f, result) -> result′\nTry.and_then(f) -> result -> result′\n\nEvaluate f(value) if result is a \"success\" wrapping a value; otherwise, a \"failure\" value as-is.\n\nInvocation Equivalent code\nand_then(f, Ok(value)) f(value)\nand_then(f, err::Err) err\nand_then(f, Some(value)) f(value)\nand_then(f, nothing) nothing\n\nSee also: @? @and_return, or_else.\n\nExtended help\n\nExamples\n\nusing Try, TryExperimental\n\ntry_map_prealloc(f, xs) =\n    Try.and_then(trygetlength(xs)) do n\n        Try.and_then(trygeteltype(xs)) do T\n            ys = Vector{T}(undef, n)\n            for (i, x) in zip(eachindex(ys), xs)\n                ys[i] = f(x)\n            end\n            return Ok(ys)\n        end\n    end\n\nTry.unwrap(try_map_prealloc(x -> x + 1, 1:3))\n\n# output\n3-element Vector{Int64}:\n 2\n 3\n 4\n\n\n\n\n\n","category":"function"},{"location":"","page":"Try.jl","title":"Try.jl","text":"See also: Customizing short-circuit evaluation.","category":"page"}]
}
