baremodule Try

export @?, Ok, Err

module InternalPrelude
abstract type AbstractResult{T,E} end
function _IsOkError end
end  # module InternalPrelude

struct Ok{T} <: InternalPrelude.AbstractResult{T,Union{}}
    value::T
end

struct Err{E} <: InternalPrelude.AbstractResult{Union{},E}
    value::E
    backtrace::Union{Nothing,typeof(InternalPrelude.backtrace())}
end

function unwrap end
function unwrap_err end

function oktype end
function errtype end
function isok end
function iserr end

function enable_errortrace end
function disable_errortrace end

# Core exceptions
struct IsOkError <: InternalPrelude.Exception
    ok::InternalPrelude.AbstractResult

    InternalPrelude._IsOkError(ok) = new(ok)
end

function map end
function transpose end

macro and_return end
function var"@?" end
function var"@return" end
macro and end
macro or end

function and end
function and_then end
function or end
function or_else end
function unwrap_or_else end

module Internal

import ..Try: @and_return, @?, @and, @or
using ..Try: Err, Ok, Try
using ..Try.InternalPrelude: AbstractResult, _IsOkError

include("ExternalDocstrings.jl")
using .ExternalDocstrings: @define_docstrings

include("core.jl")
include("errortrace.jl")
include("tools.jl")
include("branch.jl")
include("show.jl")

end  # module Internal

Internal.@define_docstrings

end  # baremodule Try
