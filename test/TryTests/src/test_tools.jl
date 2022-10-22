module TestTools

using Test
using Try
using TryExperimental
using TryExperimental: @and_then, @or_else

if !@isdefined Returns
    Returns(y) = function constant(_args...; _kwrags...)
        return y
    end
end

function trygetnitems(xs)
    Try.@and_return trygetlength(xs)
    Ok(count(Returns(true), xs))
end

function nitems(xs)
    Try.or_else(trygetlength(xs)) do _
        Ok(count(Returns(true), xs))
    end |> Try.unwrap
end

function nitems2(xs)
    Try.@return trygetlength(xs)
    count(Returns(true), xs)
end

function test_and_return()
    @test Try.unwrap(trygetnitems(1:3)) == 3

    ch = foldl(push!, 1:3; init = Channel{Int}(3))
    close(ch)
    @test Try.unwrap(trygetnitems(ch)) == 3
end

function check_nitems(nitems)
    @test nitems(1:3) == 3

    ch = foldl(push!, 1:3; init = Channel{Int}(3))
    close(ch)
    @test nitems(ch) == 3
end

test_or_else() = check_nitems(nitems)
test_return() = check_nitems(nitems2)

try_map_prealloc(f, xs) =
    Try.and_then(trygetlength(xs)) do n
        Try.and_then(trygeteltype(xs)) do T
            ys = Vector{T}(undef, n)
            for (i, x) in zip(eachindex(ys), xs)
                ys[i] = f(x)
            end
            return Ok(ys)
        end
    end

function try_map_prealloc2(f, xs)
    T = @? trygeteltype(xs)  # macro-based short-circuiting
    n = @? trygetlength(xs)
    ys = Vector{T}(undef, n)
    for (i, x) in zip(eachindex(ys), xs)
        ys[i] = f(x)
    end
    return Ok(ys)
end

function test_and_then()
    @test Try.unwrap(try_map_prealloc(x -> x + 1, 1:3)) == 2:4
end

function test_or_return()
    @test Try.unwrap(try_map_prealloc2(x -> x + 1, 1:3)) == 2:4
end

function test_and()
    @test Try.and(Ok(1), Ok(2), Ok(3)) == Try.Ok(3)
    @test Try.and(Ok(1), Err(2), Ok(3)) == Try.Err(2)
    @test Try.and(Some(1), Some(2), Some(3)) == Some(3)
    @test Try.and(Some(1), nothing, Some(3)) === nothing
    @test Try.@and(Ok(1), Ok(2), Ok(3)) == Try.Ok(3)
    @test Try.@and(Ok(1), Err(2), Ok(3)) == Try.Err(2)
    @test Try.@and(Some(1), Some(2), Some(3)) == Some(3)
    @test Try.@and(Some(1), nothing, Some(3)) === nothing
end

function test_or()
    @test Try.or(Err(1), Ok(2), Err(3)) == Try.Ok(2)
    @test Try.or(Err(1), Err(2), Err(3)) == Try.Err(3)
    @test Try.or(nothing, Some(2), Some(3)) == Some(2)
    @test Try.or(nothing, nothing, nothing) === nothing
    @test Try.@or(Err(1), Ok(2), Err(3)) == Try.Ok(2)
    @test Try.@or(Err(1), Err(2), Err(3)) == Try.Err(3)
    @test Try.@or(nothing, Some(2), Some(3)) == Some(2)
    @test Try.@or(nothing, nothing, nothing) === nothing
end

function test_unwrap_or_else()
    @test Try.unwrap_or_else(length, Try.Ok(1)) == 1
    @test Try.unwrap_or_else(length, Try.Err("four")) == 4
end

function test_curry()
    value =
        tryconvert(String, 1) |>
        Try.or_else() do _
            Ok("123")
        end |>
        Try.and_then() do x
            y = tryparse(Int, x)
            if y === nothing
                Err(ErrorException(""))
            else
                Ok(y)
            end
        end |>
        Try.unwrap

    @test value == 123
end

function demo_macro(xs)
    i = firstindex(xs)
    y = nothing
    while true
        x = @or_else(trygetindex(xs, i)) do _
            return :oob
        end
        @and_then(trygetindex(xs, Try.unwrap(x))) do z
            if z > 1
                y = z
                break
            end
        end
        i += 1
    end
    return y
end

function test_macro()
    @test demo_macro(1:2:10) == 5
    @test demo_macro(1:0) === :oob
end

function test_map()
    @test Try.map(x -> x + 1, Ok(1)) == Try.Ok(2)
    @test Try.map(x -> x + 1, Err(KeyError(:a))) == Err(KeyError(:a))
    @test Try.map(x -> x + 1, Some(1)) == Some(2)
    @test Try.map(x -> x + 1, nothing) === nothing
end

function test_double_transpose()
    @testset for x in [
        # Result-of-Maybe
        Ok(Some(1)),
        Ok(nothing),
        Err(:error),
        # Maybe-of-Result
        Some(Ok(1)),
        Some(Err(:error)),
        nothing,
    ]
        @test Try.transpose(Try.transpose(x)) == x
    end
end

end  # module
