###
### Experimental API
###

# This is very similar to Rust's `Try`` trait and `ControlFlow` enum.
# https://doc.rust-lang.org/std/ops/trait.Try.html
# https://doc.rust-lang.org/std/result/enum.Result.html
# https://doc.rust-lang.org/std/ops/enum.ControlFlow.html

struct Break{T}
    result::T
end

struct Continue{T}
    result::T
end

function branch end
function resultof end
function valueof end

###
### Implementation
###

branch(ok::Ok) = Continue(ok)
branch(err::Err) = Break(err)
branch(result::AbstractResult) =
    if Try.isok(result)
        Continue(result)
    else
        Break(result)
    end

resultof(br) = br.result

valueof(br::Continue{<:AbstractResult}) = Try.unwrap(br.result)
valueof(br::Break{<:AbstractResult}) = Try.unwrap_err(br.result)

branch(some::Some) = Continue(some)
branch(::Nothing) = Break(nothing)

valueof(br::Continue{<:Some}) = something(br.result)
valueof(::Break{Nothing}) = nothing

const var"@or_return" = var"@?"
macro or_return(ex)  # aka @?
    quote
        br = branch($(esc(ex)))
        if br isa Break
            return br.result
        else
            valueof(br)
        end
    end
end

macro and_return(ex)
    quote
        br = branch($(esc(ex)))
        if br isa Continue
            return br.result
        else
            valueof(br)
        end
    end
end

const var"@_return" = Try.var"@return"
macro _return(ex)
    quote
        br = branch($(esc(ex)))
        if br isa Continue
            return valueof(br)
        else
            valueof(br)
        end
    end
end

function Try.and_then(f, result)
    br = branch(result)
    if br isa Continue
        f(valueof(br))
    else
        br.result
    end
end

function Try.or_else(f, result)
    br = branch(result)
    if br isa Break
        f(valueof(br))
    else
        br.result
    end
end

function Try.unwrap_or_else(f, result)
    br = branch(result)
    if br isa Break
        f(valueof(br))
    else
        valueof(br)
    end
end

Try.and(result) = result

function Try.and(a, b)
    br = branch(a)
    if br isa Break
        br.result
    else
        b
    end
end

Try.and(a, b, c, rest...) = Try.and(Try.and(a, b), c, rest...)

Try.or(result) = result

function Try.or(a, b)
    br = branch(a)
    if br isa Continue
        br.result
    else
        b
    end
end

Try.or(a, b, c, rest...) = Try.or(Try.or(a, b), c, rest...)

macro and(ex, rest...)
    exprs = map(esc, Any[ex, rest...])
    foldr(exprs; init = pop!(exprs)) do result, ex
        br = esc(gensym(:br))
        quote
            $br = branch($result)
            if $br isa Break
                $br.result
            else
                $ex
            end
        end
    end
end

macro or(ex, rest...)
    exprs = map(esc, Any[ex, rest...])
    foldr(exprs; init = pop!(exprs)) do result, ex
        br = esc(gensym(:br))
        quote
            $br = branch($result)
            if $br isa Continue
                $br.result
            else
                $ex
            end
        end
    end
end

function Try.astuple(result)
    br = branch(result)
    if br isa Break
        ()
    else
        (valueof(br),)
    end
end

###
### Currying
###

# TODO: Automate currying?

function Try.and_then(f::F) where {F}
    function and_then_closure(result)
        Try.and_then(f, result)
    end
end

function Try.or_else(f::F) where {F}
    function or_else_closure(result)
        Try.or_else(f, result)
    end
end

function Try.unwrap_or_else(f::F) where {F}
    function unwrap_or_else(result)
        Try.unwrap_or_else(f, result)
    end
end
