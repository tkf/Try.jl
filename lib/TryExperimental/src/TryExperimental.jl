baremodule TryExperimental

import Try

macro tryable end
function istryable end
abstract type NotImplementedError <: Try.Internal.Base.Exception end

module InternalPrelude
include("prelude.jl")
end  # module InternalPrelude

InternalPrelude.@exported_function tryconvert
# InternalPrelude.@exported_function trypromote

# Collection interface
InternalPrelude.@exported_function trygetlength
InternalPrelude.@exported_function trygeteltype

InternalPrelude.@exported_function trygetindex
InternalPrelude.@exported_function trysetindex!

InternalPrelude.@exported_function trygetfirst
InternalPrelude.@exported_function trygetlast

InternalPrelude.@exported_function trypush!
InternalPrelude.@exported_function trypushfirst!
InternalPrelude.@exported_function trypop!
InternalPrelude.@exported_function trypopfirst!

InternalPrelude.@exported_function tryput!
InternalPrelude.@exported_function trytake!

const Break = Try.Internal.Break
const Continue = Try.Internal.Continue
const branch = Try.Internal.branch
const resultof = Try.Internal.resultof
const valueof = Try.Internal.valueof

# Basic exceptions
abstract type EmptyError <: Exception end
abstract type ClosedError <: Exception end
# abstract type FullError <: Exception end

macro and_then end
macro or_else end

baremodule Causes
function notimplemented end
function empty end
function closed end
end  # baremodule Cause

module Internal

import ..TryExperimental: @and_then, @or_else
using ..TryExperimental: TryExperimental, Causes
using ..TryExperimental.InternalPrelude: NotImplementedError
using Try
using Try.Internal: AbstractResult

for n in names(TryExperimental; all = true)
    startswith(string(n), "try") || continue
    fn = getproperty(TryExperimental, n)
    @eval import TryExperimental: $n
end

using Base.Meta: isexpr
using Base: IteratorEltype, HasEltype, IteratorSize, HasLength, HasShape

include("concrete.jl")
include("sugars.jl")
include("causes.jl")
include("base.jl")
include("show.jl")

end  # module Internal

const Result = Internal.Result
const ConcreteResult = Internal.ConcreteResult

Internal.Try.Internal.@define_docstrings

end  # baremodule TryExperimental
